# backend/Dockerfile
FROM golang:1.26-alpine AS build
RUN apk add --no-cache git build-base
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /moji-app .

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=build /moji-app /moji-app
ENV GIN_MODE=release
EXPOSE 8080
CMD ["/moji-app"]