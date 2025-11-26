variable "role_name" {
  description = "Name of the IAM role for SpotSave"
  type        = string
  default     = "SpotSaveRole"
}

variable "spotsave_account_id" {
  description = "AWS Account ID of SpotSave service (your SpotSave account)"
  type        = string
  # Default to a placeholder - customer must provide this
  # In production, you'd get this from SpotSave's onboarding process
}

variable "tags" {
  description = "Tags to apply to the IAM role"
  type        = map(string)
  default     = {}
}

