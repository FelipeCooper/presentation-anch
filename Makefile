.PHONY: run-demo-1 run-demo-2 run-demo-3 run-all stop

# Demo 1 - Raw Prompt (Node.js backend + CRA frontend)
# Backend: http://localhost:3001 | Frontend: http://localhost:3000
run-demo-1:
	@echo "Starting Demo 1: Raw Prompt..."
	@cd crypto-raw-prompt/backend && npm install --silent && node index.js &
	@cd crypto-raw-prompt/frontend && npm install --silent && npm start &
	@echo "Backend: http://localhost:3001"
	@echo "Frontend: http://localhost:3000"
	@wait

# Demo 2 - Raw Prompt + Plan Mode (Node.js backend + Vite frontend)
# Backend: http://localhost:3002 | Frontend: http://localhost:5174
run-demo-2:
	@echo "Starting Demo 2: Raw Prompt + Plan Mode..."
	@cd crypto-raw-prompt-with-planmode && npm install --silent && npm run dev
	@echo "Server: http://localhost:3002"
	@echo "Client: http://localhost:5174"

# Demo 3 - SDD (Go backend + Vite frontend)
# Backend: http://localhost:3003 | Frontend: http://localhost:5175
run-demo-3:
	@echo "Starting Demo 3: SDD (Go + React)..."
	@cd crypto-raw-prompt-with-sdd && make dev

# Run all demos simultaneously
run-all:
	@echo "Starting all demos..."
	@echo ""
	@echo "Demo 1: Backend :3001  | Frontend :3000"
	@echo "Demo 2: Backend :3002  | Frontend :5174"
	@echo "Demo 3: Backend :3003  | Frontend :5175"
	@echo ""
	@trap 'kill 0' INT TERM; \
		$(MAKE) run-demo-1 & \
		$(MAKE) run-demo-2 & \
		$(MAKE) run-demo-3 & \
		wait

# Stop all running demo processes
stop:
	@echo "Stopping all demo processes..."
	-@pkill -f "node index.js" 2>/dev/null || true
	-@pkill -f "react-scripts start" 2>/dev/null || true
	-@pkill -f "vite" 2>/dev/null || true
	-@pkill -f "go run main.go" 2>/dev/null || true
	@echo "Done."
