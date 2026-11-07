locals {
  required_services = toset([
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])
}

resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "containers" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = "Container images for Packster"
  format        = "DOCKER"

  depends_on = [google_project_service.required]
}

resource "google_service_account" "backend" {
  project      = var.project_id
  account_id   = "${var.resource_prefix}-backend"
  display_name = "Packster Cloud Run backend"
}

resource "google_secret_manager_secret" "database_url" {
  project   = var.project_id
  secret_id = "${var.resource_prefix}-database-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret" "google_client_id" {
  project   = var.project_id
  secret_id = "${var.resource_prefix}-google-client-id"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret" "google_client_secret" {
  project   = var.project_id
  secret_id = "${var.resource_prefix}-google-client-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_iam_member" "backend_access" {
  for_each = {
    database_url         = google_secret_manager_secret.database_url.secret_id
    google_client_id     = google_secret_manager_secret.google_client_id.secret_id
    google_client_secret = google_secret_manager_secret.google_client_secret.secret_id
  }

  project   = var.project_id
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_cloud_run_v2_service" "backend" {
  count = var.deploy_backend ? 1 : 0

  lifecycle {
    precondition {
      condition     = trimspace(var.backend_image) != ""
      error_message = "Set backend_image to a pushed Artifact Registry image when deploy_backend is true."
    }
  }

  project  = var.project_id
  name     = "${var.resource_prefix}-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account                  = google_service_account.backend.email
    max_instance_request_concurrency = 80
    timeout                          = "3600s"

    scaling {
      max_instance_count = 1
    }

    containers {
      image = var.backend_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "FRONTEND_ORIGIN"
        value = var.frontend_origin
      }

      env {
        name  = "GOOGLE_REDIRECT_URL"
        value = var.google_redirect_url
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "GOOGLE_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.google_client_id.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "GOOGLE_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.google_client_secret.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_secret_manager_secret_iam_member.backend_access,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  count = var.deploy_backend ? 1 : 0

  project  = var.project_id
  location = google_cloud_run_v2_service.backend[0].location
  name     = google_cloud_run_v2_service.backend[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service" "frontend" {
  count = var.deploy_frontend ? 1 : 0

  lifecycle {
    precondition {
      condition     = trimspace(var.frontend_image) != ""
      error_message = "Set frontend_image to a pushed Artifact Registry image when deploy_frontend is true."
    }
  }

  project  = var.project_id
  name     = "${var.resource_prefix}-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    max_instance_request_concurrency = 80

    scaling {
      max_instance_count = 1
    }

    containers {
      image = var.frontend_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [google_project_service.required]
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  count = var.deploy_frontend ? 1 : 0

  project  = var.project_id
  location = google_cloud_run_v2_service.frontend[0].location
  name     = google_cloud_run_v2_service.frontend[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
