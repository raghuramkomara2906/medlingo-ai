# convert_m4a_to_wav.py
import sys
from pydub import AudioSegment

def convert_m4a_to_wav(m4a_path: str, wav_path: str) -> None:
    """
    Convert M4A file to WAV (16kHz, mono) for API Gateway.
    """
    audio = AudioSegment.from_file(m4a_path, format="m4a")
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(wav_path, format="wav")
    print(f"Converted: {m4a_path} → {wav_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_m4a_to_wav.py <input.m4a> <output.wav>")
        sys.exit(1)
    
    convert_m4a_to_wav(sys.argv[1], sys.argv[2])