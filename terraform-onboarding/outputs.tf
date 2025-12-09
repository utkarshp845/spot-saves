output "role_arn" {
  description = "ARN of the IAM role that SpotSave should use"
  value       = aws_iam_role.spotsave_role.arn
}

output "external_id" {
  description = "External ID that must be used when assuming this role"
  value       = random_uuid.external_id.result
  sensitive   = true
}

output "instructions" {
  description = "Instructions for using this role with SpotSave"
  value = <<-EOT
    Your SpotSave IAM role has been created successfully!
    
    Role ARN: ${aws_iam_role.spotsave_role.arn}
    External ID: ${random_uuid.external_id.result}
    
    Next steps:
    1. Copy the Role ARN and External ID above
    2. Go to https://your-spotsave-instance.com/scan
    3. Paste the Role ARN and External ID
    4. Click "Start Scan"
    
    Note: Keep the External ID secure. It's required for all future scans.
  EOT
}

