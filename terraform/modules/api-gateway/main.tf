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
    max_age          = var.cors_max_age
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
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      routeKey      = "$context.routeKey"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
      error         = "$context.error.message"
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
}

# API Routes

# Health check route (now handled by main API Lambda)
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_api.id}"
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
}



# Custom domain name (optional)
resource "aws_apigatewayv2_domain_name" "main" {
  count       = var.custom_domain_name != null ? 1 : 0
  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-domain"
    Type = "APIGatewayDomain"
  })
}

# API mapping for custom domain
resource "aws_apigatewayv2_api_mapping" "main" {
  count       = var.custom_domain_name != null ? 1 : 0
  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.main[0].id
  stage       = aws_apigatewayv2_stage.main.id
} 