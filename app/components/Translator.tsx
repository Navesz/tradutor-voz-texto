'use client';

import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Anthropic from '@anthropic-ai/sdk';
import 'regenerator-runtime/runtime';

// Definição de tipos para idiomas
type LanguageCode = 
  'en' | 'es' | 'fr' | 'de' | 'ru' | 'it' | 'pt' | 'zh' | 'ja' | 'ar' | 'hi' | 'ko';

interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  speechSynthesisCode: string;
}

const Translator = () => {
  // Lista de idiomas suportados
  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', speechSynthesisCode: 'en-US' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', speechSynthesisCode: 'es-ES' },
    { code: 'fr', name: 'French', nativeName: 'Français', speechSynthesisCode: 'fr-FR' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', speechSynthesisCode: 'de-DE' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', speechSynthesisCode: 'ru-RU' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', speechSynthesisCode: 'it-IT' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', speechSynthesisCode: 'pt-BR' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', speechSynthesisCode: 'zh-CN' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', speechSynthesisCode: 'ja-JP' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', speechSynthesisCode: 'ar-SA' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechSynthesisCode: 'hi-IN' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', speechSynthesisCode: 'ko-KR' },
  ];

  const [translatedText, setTranslatedText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [targetLanguage, setTargetLanguage] = useState<Language>(languages[0]); // Inglês como padrão
  
  // Referência para o atual texto que está sendo falado
  const currentSpeakingText = useRef<string>('');
  
  // Referência para armazenar o texto anterior para detectar novas palavras
  const previousTranscript = useRef<string>('');
  const previousTranslation = useRef<string>('');
  
  // Configuração do reconhecimento de voz
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Estado para controlar se devemos traduzir ou não
  const [shouldTranslate, setShouldTranslate] = useState<boolean>(false);

  // Configurar o cliente Anthropic
  const anthropicApiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  const anthropicModel = process.env.NEXT_PUBLIC_ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';

  // Função para lidar com a mudança de idioma
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value as LanguageCode;
    const selectedLanguage = languages.find(lang => lang.code === selectedCode) || languages[0];
    setTargetLanguage(selectedLanguage);
    
    // Limpar traduções anteriores quando o idioma mudar
    setTranslatedText('');
    previousTranslation.current = '';
    
    // Cancelar qualquer fala em andamento
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };
  
  // Função para traduzir usando a SDK da Anthropic
  const translateWithClaude = async (text: string) => {
    if (!text.trim()) return '';
    
    setIsTranslating(true);
    setErrorMessage('');
    
    try {
      // Inicializar o cliente Anthropic - adicionando a opção para permitir uso no navegador
      const anthropic = new Anthropic({
        apiKey: anthropicApiKey,
        dangerouslyAllowBrowser: true  // Permitir uso no navegador
      });
      
      // Fazer a chamada para a API
      const response = await anthropic.messages.create({
        model: anthropicModel,
        max_tokens: 1000,
        messages: [
          { 
            role: "user", 
            content: `Traduza o seguinte texto do português para o ${targetLanguage.name} (${targetLanguage.nativeName}), mantendo o mesmo significado:\n\n"${text}"\n\nApenas forneça a tradução, sem explicações ou texto adicional.`
          }
        ],
      });
      
      // Extrair e retornar a resposta
      return response.content[0].text;
    } catch (error) {
      console.error('Erro ao traduzir:', error);
      setErrorMessage('Erro ao traduzir. Tente novamente.');
      return '';
    } finally {
      setIsTranslating(false);
    }
  };

  // Função para falar o texto traduzido
  const speakTranslatedText = (text: string) => {
    // Verifica se a API de síntese de voz está disponível
    if ('speechSynthesis' in window) {
      // Se já estiver falando algo, pare
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      // Não fale se o texto for vazio ou se for o mesmo que já estamos falando
      if (!text.trim() || text === currentSpeakingText.current) return;
      
      // Atualiza o texto atual
      currentSpeakingText.current = text;
      
      // Cria um novo objeto de fala
      const speech = new SpeechSynthesisUtterance(text);
      
      // Configura para falar no idioma selecionado
      speech.lang = targetLanguage.speechSynthesisCode;
      speech.rate = 1.0;  // Velocidade normal
      speech.pitch = 1.0; // Tom normal
      speech.volume = 1.0; // Volume máximo
      
      // Define eventos
      speech.onstart = () => setIsSpeaking(true);
      speech.onend = () => {
        setIsSpeaking(false);
        currentSpeakingText.current = '';
      };
      speech.onerror = () => {
        setIsSpeaking(false);
        currentSpeakingText.current = '';
      };
      
      // Inicia a fala
      window.speechSynthesis.speak(speech);
    } else {
      console.error('Síntese de voz não é suportada neste navegador');
      setErrorMessage('Seu navegador não suporta síntese de voz');
    }
  };

  // Efeito para traduzir o texto quando o transcript mudar
  useEffect(() => {
    // Armazenar o valor atual do transcript para uso no efeito
    const currentTranscript = transcript;
    
    const translateText = async () => {
      if (currentTranscript && shouldTranslate && currentTranscript !== previousTranscript.current) {
        previousTranscript.current = currentTranscript;
        
        // Traduz o texto completo para manter a coerência da tradução
        const translated = await translateWithClaude(currentTranscript);
        
        if (translated) {
          setTranslatedText(translated);
          
          // Se o modo automático estiver ativado, fale apenas as novas palavras
          if (autoSpeak) {
            // Obtém apenas a parte nova do texto traduzido
            const newTranslatedContent = getNewContent(translated, previousTranslation.current);
            
            // Fala apenas o novo conteúdo se existir
            if (newTranslatedContent && newTranslatedContent.trim() !== '') {
              speakTranslatedText(newTranslatedContent);
            }
            
            // Atualiza a referência do texto anterior DEPOIS de obter o novo conteúdo
            previousTranslation.current = translated;
          }
        }
      }
    };
    
    // Adicionar um pequeno atraso para não fazer muitas chamadas à API
    // e para permitir que o reconhecimento de voz agrupe palavras em frases
    const timeoutId = setTimeout(translateText, 1500);
    
    // Limpar o timeout se o componente for desmontado ou o transcript mudar novamente
    return () => clearTimeout(timeoutId);
  }, [transcript, shouldTranslate, autoSpeak]);

  // Função para iniciar a escuta
  const startListening = () => {
    resetTranscript();
    setTranslatedText('');
    previousTranscript.current = '';
    previousTranslation.current = '';
    setIsListening(true);
    setShouldTranslate(true);
    SpeechRecognition.startListening({ 
      continuous: true,
      language: 'pt-BR'  // Definir idioma para português do Brasil
    });
  };
  
  // Função para parar a escuta
  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    setShouldTranslate(false);
  };
  
  // Função para falar o texto traduzido manualmente
  const handleSpeakClick = () => {
    if (translatedText) {
      speakTranslatedText(translatedText);
    }
  };
  
  // Alternar modo de fala automática
  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
  };
  
  // Função de reset completo
  const handleReset = () => {
    stopListening();
    resetTranscript();
    setTranslatedText('');
    previousTranscript.current = '';
    previousTranslation.current = '';
    
    // Parar qualquer fala em andamento
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
  
  // Função auxiliar para obter apenas o novo conteúdo adicionado ao texto
  const getNewContent = (currentText: string, previousText: string): string => {
    if (!previousText) return currentText;
    
    // Compare o texto atual com o anterior para ver o que foi adicionado
    // Este é um método simples - pode não ser perfeito para todos os idiomas
    // ou quando o AI modifica a tradução anterior
    
    // Se o texto anterior estiver contido no início do texto atual,
    // retorne apenas a parte adicional
    if (currentText.startsWith(previousText)) {
      return currentText.substring(previousText.length);
    }
    
    // Caso contrário, retorne o texto completo
    // Isso acontece quando a tradução muda significativamente
    return currentText;
  };

  // Se o navegador não suportar reconhecimento de voz, mostre uma mensagem de erro
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-red-500 text-lg">
          Seu navegador não suporta reconhecimento de voz.
          Por favor, use um navegador mais recente como Chrome, Edge ou Safari.
        </p>
      </div>
    );
  }

  // Renderização do componente
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Tradutor de Voz em Tempo Real
      </h1>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2" htmlFor="language-select">
          Traduzir para:
        </label>
        <select
          id="language-select"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={targetLanguage.code}
          onChange={handleLanguageChange}
          disabled={isListening}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.nativeName})
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-700 font-medium">Seu áudio (Português):</p>
          
          {/* Status do microfone */}
          <div className="flex items-center">
            {listening && (
              <div className="flex items-end space-x-1 mr-2">
                <div className="w-1 bg-red-500 rounded-t animate-sound-wave-1"></div>
                <div className="w-1 bg-red-500 rounded-t animate-sound-wave-2"></div>
                <div className="w-1 bg-red-500 rounded-t animate-sound-wave-3"></div>
                <div className="w-1 bg-red-500 rounded-t animate-sound-wave-2"></div>
                <div className="w-1 bg-red-500 rounded-t animate-sound-wave-1"></div>
              </div>
            )}
            
            <span className={`text-sm ${listening ? 'text-red-500' : 'text-gray-500'}`}>
              {listening ? 'Ouvindo...' : 'Microfone desativado'}
            </span>
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-md min-h-24 max-h-40 overflow-y-auto">
          {transcript || <span className="text-gray-400">Comece a falar...</span>}
        </div>
      </div>
      
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-700 font-medium">
            Tradução ({targetLanguage.name}):
          </p>
          
          {/* Status da tradução */}
          <div className="flex items-center">
            {isTranslating && (
              <span className="text-sm text-blue-500 mr-2">Traduzindo...</span>
            )}
            {isSpeaking && (
              <span className="text-sm text-green-500 mr-2">Falando...</span>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-md min-h-24 max-h-40 overflow-y-auto">
          {translatedText || <span className="text-gray-400">A tradução aparecerá aqui...</span>}
        </div>
      </div>
      
      {/* Botões de controle */}
      <div className="flex flex-wrap gap-2 justify-between mb-4">
        {!isListening ? (
          <button
            onClick={startListening}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          >
            Iniciar
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex-1"
          >
            Parar
          </button>
        )}
        
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex-1"
        >
          Limpar
        </button>
        
        <button
          onClick={handleSpeakClick}
          disabled={!translatedText || isSpeaking}
          className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 ${
            !translatedText || isSpeaking
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          Ouvir tradução
        </button>
      </div>
      
      {/* Opção de fala automática */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="auto-speak"
          checked={autoSpeak}
          onChange={toggleAutoSpeak}
          className="mr-2"
        />
        <label htmlFor="auto-speak" className="text-gray-700">
          Falar tradução automaticamente
        </label>
      </div>
      
      {/* Mensagem de erro */}
      {errorMessage && (
        <div className="p-2 bg-red-100 text-red-700 rounded-md mt-4">
          {errorMessage}
        </div>
      )}
      
      {/* Dicas de uso */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm">
        <h3 className="font-medium text-blue-700 mb-2">Dicas de uso:</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Fale em português claramente para melhores resultados.</li>
          <li>Mantenha frases curtas para traduções mais rápidas.</li>
          <li>É possível que haja um pequeno atraso na tradução.</li>
          <li>Para idiomas como chinês e japonês, a síntese de voz pode ter limitações dependendo do navegador.</li>
        </ul>
      </div>
    </div>
  );
};

export default Translator;