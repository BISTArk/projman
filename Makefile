# ProjMan Build Automation Makefile

.PHONY: install dev build clean help

help:
	@echo "ProjMan Build Automation Commands:"
	@echo "  make install  - Install package dependencies"
	@echo "  make dev      - Start Tauri dev client"
	@echo "  make build    - Compile and bundle production installers (.exe)"
	@echo "  make clean    - Clean Rust target build caches"

install:
	npm install

dev:
	npm run tauri dev

build:
	npm run tauri build

clean:
	cd src-tauri && cargo clean
