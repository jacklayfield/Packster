FROM golang:1.25-alpine AS builder
WORKDIR /src

COPY go-backend/go.mod go-backend/go.sum ./go-backend/
WORKDIR /src/go-backend
RUN go mod download

COPY go-backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/packster ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /out/packster /packster
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/packster"]
