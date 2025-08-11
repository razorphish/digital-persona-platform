# =================================
# API Gateway Module
# =================================
# This module creates an API Gateway v2 (HTTP API) for routing
# requests to Lambda functions

# API Gateway v2 (HTTP API)
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.environment}-${var.sub_environment}-${var.project_name}-api"
  description   = "${var.project_name} HTTP API for ${var.environment}/${var.sub_environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = var.cors_allow_credentials
    allow_headers     = var.cors_allow_headers
    allow_methods     = var.cors_allow_methods
    allow_origins     = var.cors_allow_origins
    expose_headers    = var.cors_expose_headers
    max_age           = var.cors_max_age
  }

  # Temporarily disabled tags to resolve AWS permissions issue
  # tags = merge(var.common_tags, {
  #   Name = "${var.environment}-${var.sub_environment}-${var.project_name}-api"
  #   Type = "APIGateway"
  # })
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.stage_name
  auto_deploy = var.auto_deploy

  # Access logging configuration
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      ip               = "$context.identity.sourceIp"
      requestTime      = "$context.requestTime"
      httpMethod       = "$context.httpMethod"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      protocol         = "$context.protocol"
      responseLength   = "$context.responseLength"
      error            = "$context.error.message"
      integrationError = "$context.integration.error"
    })
  }

  # Default route settings
  default_route_settings {
    detailed_metrics_enabled = var.enable_detailed_metrics
    throttling_burst_limit   = var.throttling_burst_limit
    throttling_rate_limit    = var.throttling_rate_limit
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-stage"
    Type = "APIGatewayStage"
  })

  depends_on = [aws_cloudwatch_log_group.api_gateway]
}

# CloudWatch log group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.environment}-${var.sub_environment}-${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-api-logs"
    Type = "LogGroup"
  })
}

# Lambda integrations

# Main API integration (handles all routes including health)
resource "aws_apigatewayv2_integration" "lambda_api" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = var.lambda_function_invoke_arn

  integration_method     = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000

  # Ensure this integration is stable before routes reference it
  lifecycle {
    create_before_destroy = true
  }
}

# API Routes

# Health check route (now handled by main API Lambda)
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_api.id}"

  # Ensure this route update happens before any integration deletion
  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_apigatewayv2_integration.lambda_api
  ]
}

# Main API routes (catch-all for tRPC)
resource "aws_apigatewayv2_route" "api_trpc" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/trpc/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_api.id}"
}

# Default route (optional - for SPA fallback)
resource "aws_apigatewayv2_route" "default" {
  count     = var.enable_default_route ? 1 : 0
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_api.id}"
}

# Lambda permissions for API Gateway

# Permission for main Lambda function
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"

  # Ensure this permission is created after the API and routes
  depends_on = [
    aws_apigatewayv2_api.main,
    aws_apigatewayv2_stage.main,
    aws_apigatewayv2_route.health,
    aws_apigatewayv2_route.api_trpc
  ]
}



# CloudFront Distribution for API (provides CDN, SSL termination, and caching)
resource "aws_cloudfront_distribution" "api" {
  count           = var.custom_domain_name != null ? 1 : 0
  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_100"

  # Use custom domain for CloudFront
  aliases = [var.custom_domain_name]

  origin {
    domain_name = replace(replace(aws_apigatewayv2_api.main.api_endpoint, "https://", ""), "http://", "")
    origin_id   = "APIGateway-${aws_apigatewayv2_api.main.id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    origin_path = "/${aws_apigatewayv2_stage.main.name}"
  }

  # Attach a strict CORS response headers policy at the CDN layer so even
  # Gateway/CloudFront-generated errors include the correct CORS headers.
  # This complements (does not replace) API Gateway CORS.
  depends_on = [aws_cloudfront_response_headers_policy.api_cors]

  # Default cache behavior for API (no caching for dynamic content)
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "APIGateway-${aws_apigatewayv2_api.main.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    # No caching for API responses
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # SSL certificate configuration
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

  # Cache behavior for health check (can be lightly cached)
  ordered_cache_behavior {
    path_pattern           = "/health*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "APIGateway-${aws_apigatewayv2_api.main.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 60  # Cache health checks for 1 minute
    max_ttl     = 300 # Max 5 minutes
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-api-cdn"
    Type = "CloudFrontDistribution"
  })
}

# CloudFront Response Headers Policy for CORS (reflects configured origins)
resource "aws_cloudfront_response_headers_policy" "api_cors" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-api-cors"

  cors_config {
    access_control_allow_credentials = var.cors_allow_credentials

    access_control_allow_headers {
      items = var.cors_allow_headers
    }

    access_control_allow_methods {
      items = var.cors_allow_methods[0] == "*" ? ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"] : var.cors_allow_methods
    }

    access_control_allow_origins {
      items = var.cors_allow_origins
    }

    origin_override = true
  }
}
