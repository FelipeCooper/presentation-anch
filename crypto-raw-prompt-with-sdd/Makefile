include .env
export

.PHONY: dev backend frontend install test test-e2e build clean

# Run backend + frontend in parallel
dev: install
	@echo "Starting backend (localhost:3003) and frontend (localhost:5175)..."
	@trap 'kill 0' INT TERM; \
		$(MAKE) backend & \
		$(MAKE) frontend & \
		wait

backend:
	go run main.go

frontend:
	cd frontend && npm run dev

install:
	cd frontend && npm install --silent

test:
	cd frontend && npm run test

test-e2e:
	cd frontend && npm run test:e2e

build:
	go build -o bin/server main.go
	cd frontend && npm run build

clean:
	rm -rf bin frontend/dist frontend/node_modules/.vite
