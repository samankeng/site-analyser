variable "mongodb_username" {
  description = "Username for MongoDB"
  type        = string
  sensitive   = true
}

variable "mongodb_password" {
  description = "Password for MongoDB"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "shodan_api_key" {
  description = "Shodan API key"
  type        = string
  sensitive   = true
}

variable "virustotal_api_key" {
  description = "VirusTotal API key"
  type        = string
  sensitive   = true
}

variable "ai_service_api_key" {
  description = "API key for the AI service"
  type        = string
  sensitive   = true
}
