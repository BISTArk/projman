# ProjMan Build Automation Makefile

SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -Command

.PHONY: install dev build sign release clean help

help:
	Write-Host 'ProjMan Build Commands:'; \
	Write-Host '  make install  - Install npm dependencies'; \
	Write-Host '  make dev      - Start Tauri dev client'; \
	Write-Host '  make build    - Compile production installers'; \
	Write-Host '  make sign     - Sign compiled installers'; \
	Write-Host '  make release  - Build + sign in one step'; \
	Write-Host '  make clean    - Clean Rust build cache'

install:
	npm install

dev:
	npm run tauri dev

build:
	npm run tauri build

sign:
	powershell -ExecutionPolicy Bypass -File sign.ps1

release: build sign

clean:
	Set-Location src-tauri; cargo clean
