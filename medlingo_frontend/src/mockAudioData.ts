// Mock audio data for testing
export const mockAudioData = {
  patient: [
    {
      original: "Hola, me duele mucho la cabeza",
      translated: "Hello, I have a very bad headache",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
      original: "¿Puede ayudarme con mi dolor de estómago?",
      translated: "Can you help me with my stomach pain?",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    },
    {
      original: "Tengo fiebre y me siento muy cansado",
      translated: "I have a fever and I feel very tired",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
    },
    {
      original: "¿Cuánto tiempo tomará la recuperación?",
      translated: "How long will the recovery take?",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    },
    {
      original: "Gracias por su ayuda, doctor",
      translated: "Thank you for your help, doctor",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
    }
  ],
  doctor: [
    {
      original: "Hello, I can help you with that headache",
      translated: "Hola, puedo ayudarte con ese dolor de cabeza",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3"
    },
    {
      original: "Let me examine your stomach area",
      translated: "Déjame examinar tu área del estómago",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3"
    },
    {
      original: "You should rest and take this medication",
      translated: "Debes descansar y tomar esta medicación",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"
    },
    {
      original: "The recovery should take about 2 weeks",
      translated: "La recuperación debería tomar aproximadamente 2 semanas",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3"
    },
    {
      original: "You're welcome, take care of yourself",
      translated: "De nada, cuídate bien",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3",
      translatedAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3"
    }
  ]
};

export const getRandomMockData = (speaker: 'patient' | 'doctor') => {
  const data = mockAudioData[speaker];
  return data[Math.floor(Math.random() * data.length)];
};
