# =================================
# Optimized API Gateway Module (Alternative Architecture)
# =================================
# This module creates a single API Gateway per main environment (dev, qa, prod)
# with separate stages for sub-environments (dev01, dev02, etc.)

# Single API Gateway per main environment
resource "aws_apigatewayv2_api" "main" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-api"
  
  lifecycle {
    prevent_destroy = true  # Prevent accidental deletion
  }
}

# Stage for each sub-environment
resource "aws_apigatewayv2_stage" "sub_environments" {
  for_each = var.sub_environments

  api_id      = aws_apigatewayv2_api.main.id
  name        = each.key  # dev01, dev02, qa01, etc.
  auto_deploy = var.auto_deploy

  # Access logging configuration
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway[each.key].arn
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
      stage         = "$context.stage"
    })
  }

  # Stage-specific settings
  default_route_settings {
    detailed_metrics_enabled = var.enable_detailed_metrics
    throttling_burst_limit   = var.throttling_burst_limit
    throttling_rate_limit    = var.throttling_rate_limit
  }

  # Stage variables for sub-environment routing
  stage_variables = {
    sub_environment = each.key
    lambda_alias    = each.key
  }

  tags = merge(var.common_tags, {
    Name = "${var.main_environment}-${each.key}-${var.project_name}-stage"
    Type = "APIGatewayStage"
    SubEnvironment = each.key
  })

  depends_on = [aws_cloudwatch_log_group.api_gateway]
}

# CloudWatch log group for each sub-environment
resource "aws_cloudwatch_log_group" "api_gateway" {
  for_each = var.sub_environments

  name              = "/aws/apigateway/${var.main_environment}-${each.key}-${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.main_environment}-${each.key}-${var.project_name}-api-logs"
    Type = "LogGroup"
    SubEnvironment = each.key
  })
}

# Lambda integrations for each sub-environment
resource "aws_apigatewayv2_integration" "lambda_api" {
  for_each = var.sub_environments

  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = each.value.lambda_function_invoke_arn

  integration_method     = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
  
  lifecycle {
    create_before_destroy = true
  }
}

# Routes for each sub-environment
resource "aws_apigatewayv2_route" "health" {
  for_each = var.sub_environments

  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_api[each.key].id}"
  
  # Route selection expression to route to correct stage
  route_response_selection_expression = "$default"
  
  lifecycle {
    create_before_destroy = true
  }
  
  depends_on = [aws_apigatewayv2_integration.lambda_api]
}

# Main API routes (catch-all for tRPC) for each sub-environment  
resource "aws_apigatewayv2_route" "api_trpc" {
  for_each = var.sub_environments

  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/trpc/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_api[each.key].id}"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  for_each = var.sub_environments

  statement_id  = "AllowExecutionFromAPIGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Outputs
output "api_gateway_id" {
  description = "ID of the main API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "api_urls" {
  description = "URLs for each sub-environment stage"
  value = {
    for env, config in var.sub_environments : 
    env => "${aws_apigatewayv2_api.main.api_endpoint}/${env}"
  }
}

output "stage_invoke_urls" {
  description = "Invoke URLs for each stage"
  value = {
    for env, stage in aws_apigatewayv2_stage.sub_environments :
    env => stage.invoke_url
  }
} 