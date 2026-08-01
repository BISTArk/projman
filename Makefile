# ProjMan Build Automation Makefile

ifeq ($(OS),Windows_NT)
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command
endif

.PHONY: install dev build build-macos sign release clean help

help:
	@echo 'ProjMan Build Commands:'
	@echo '  make install      - Install npm dependencies'
	@echo '  make dev          - Start Tauri dev client'
	@echo '  make build        - Compile production installers'
	@echo '  make build-macos  - Compile the macOS app and DMG'
	@echo '  make sign         - Sign Windows installers (Windows only)'
	@echo '  make release      - Build + sign on Windows'
	@echo '  make clean        - Clean Rust build cache'

install:
	npm install

dev:
	npm run tauri dev

build:
	npm run tauri build

build-macos:
	npm run build:macos

sign:
	powershell -ExecutionPolicy Bypass -File sign.ps1

release: build sign

ifeq ($(OS),Windows_NT)
clean:
	Set-Location src-tauri; cargo clean
else
clean:
	cd src-tauri && cargo clean
endif
