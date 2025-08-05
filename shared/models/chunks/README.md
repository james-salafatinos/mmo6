# Chunk Models Directory

This directory contains the 3D models for world chunks exported from Blender.

## File Naming Convention

Chunks should be named using the format: `chunk_X_Z.glb`

Where:
- X is the chunk coordinate on the X-axis
- Z is the chunk coordinate on the Z-axis

## Expected Files

The following chunk files are expected for the initial implementation:

- `chunk_0_0.glb` - Chunk at world position (0, 0)
- `chunk_0_1.glb` - Chunk at world position (0, 10)
- `chunk_1_0.glb` - Chunk at world position (10, 0)
- `chunk_1_1.glb` - Chunk at world position (10, 10)

## Chunk Size

Each chunk represents a 10x10 world unit area by default (configurable in ChunkComponent.js).

## Export Settings

When exporting from Blender:
1. Use glTF 2.0 format (.glb)
2. Include materials and textures
3. Apply transforms before export
4. Ensure proper scale (1 Blender unit = 1 Three.js unit)

## Usage

The AssetLoader will automatically load these files when the ChunkSystem requests them based on player position.
