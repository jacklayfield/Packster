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

variable "resource_prefix" {
  description = "Prefix used for Packster Cloud Run services, secrets, and service account."
  type        = string
  default     = "packster"
}

variable "deploy_backend" {
  description = "Whether to create the public Cloud Run backend service."
  type        = bool
  default     = false
}

variable "deploy_frontend" {
  description = "Whether to create the public Cloud Run frontend service."
  type        = bool
  default     = false
}

variable "backend_image" {
  description = "Full Artifact Registry image URI for the backend."
  type        = string
  default     = ""
}

variable "frontend_image" {
  description = "Full Artifact Registry image URI for the frontend."
  type        = string
  default     = ""
}

variable "frontend_origin" {
  description = "Exact origin of the frontend, including scheme, for CORS and WebSocket origin checks."
  type        = string
  default     = "http://localhost:3000"
}

variable "google_redirect_url" {
  description = "Exact Google OAuth callback URL. Set after obtaining the backend Cloud Run URL."
  type        = string
  default     = ""
}
