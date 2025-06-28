# Sounds Directory

This directory contains audio assets for the Super Student game:

## Audio Categories:

### Sound Effects:
- Laser/shooting sounds
- Explosion effects  
- UI interactions (clicks, hovers)
- Success/failure feedback
- Power-up activation

### Ambient Audio:
- Background music themes
- Space ambiance
- Environmental loops

## Supported Formats:
- .mp3 (preferred - good compression, wide support)
- .wav (uncompressed, high quality)
- .ogg (alternative compressed format)

## Audio Guidelines:
- Keep file sizes reasonable (< 1MB for SFX, < 5MB for music)
- Use consistent volume levels
- Consider looping for ambient tracks
- Sample rate: 44.1kHz recommended

## File Examples:
- `laser-fire.mp3`
- `explosion-large.wav`
- `button-click.mp3`
- `success-chime.mp3`
- `ambient-space.mp3`

## Usage:
Audio files are loaded and managed via SoundManager using Web Audio API.
