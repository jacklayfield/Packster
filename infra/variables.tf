variable "project_id" {
  description = "ID of an existing Google Cloud project with billing enabled."
  type        = string
}

variable "region" {
  description = "Default region for GCP resources."
  type        = string
  default     = "us-central1"
}

variable "repository_id" {
  description = "Artifact Registry repository ID for Packster container images."
  type        = string
  default     = "packster"
}
