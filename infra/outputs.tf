output "image_repository" {
  description = "Docker repository path for tagging Packster images."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}
