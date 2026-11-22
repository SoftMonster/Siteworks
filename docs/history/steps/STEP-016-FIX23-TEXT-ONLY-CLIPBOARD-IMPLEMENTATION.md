# STEP-016 — FIX23 text-only clipboard implementation

**Date:** 2026-11-21  
**Baseline:** FIX22  
**Result:** implementation candidate; Windows acceptance pending

## Problem
The previous launcher combined an evidence-board image and text in one clipboard DataObject. Andrew's actual paste delivered an image or empty attachment rather than the diagnostic text. The complex evidence-board function also appeared in the reported PowerShell parser failure area.

## Changes
- Removed evidence-board rendering and dual-format clipboard handling.
- Added a plain-text report assembled from run metadata and the complete transcript.
- Added Unicode text clipboard write and exact read-back equality check.
- Kept screenshots and feedback ZIP local.
- Added run JSON and SHA-256 artifact manifest.
- Preserved local report fallback when clipboard delivery fails.

## Evidence boundary
This environment cannot execute Windows PowerShell 5.1 or prove how ChatGPT receives the clipboard paste. The launcher is an implementation candidate only. Do not mark the feedback loop accepted until Andrew's Windows run and actual pasted report are inspected.
