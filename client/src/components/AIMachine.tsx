import React, { useState, useRef } from 'react';

interface Command {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
}

export default function AIMachine() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Check authentication status on mount
  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user', {
        credentials: 'include'
      });
      setIsLoggedIn(response.ok);
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/api/dev/login';
  };

  const handleFileUpload = (file: File) => {
    if (!isLoggedIn) {
      addSystemMessage('❌ AUTHENTICATION REQUIRED - Please login first to upload files');
      return;
    }
    setUploadedFile(file);
    addSystemMessage(`📁 File uploaded: ${file.name}`);
  };

  const addSystemMessage = (message: string) => {
    setCommands(prev => [...prev, {
      id: Date.now().toString(),
      command: '',
      response: message,
      timestamp: new Date()
    }]);
  };

  const addCommand = async (command: string) => {
    if (!command.trim()) return;

    if (!isLoggedIn) {
      addSystemMessage('❌ AUTHENTICATION REQUIRED - Please login first');
      return;
    }

    const userCommand: Command = {
      id: Date.now().toString(),
      command: command.trim(),
      response: '',
      timestamp: new Date()
    };

    setCommands(prev => [...prev, userCommand]);
    setCurrentCommand('');
    setIsProcessing(true);

    // Scroll to bottom
    setTimeout(() => {
      terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);

    try {
      const response = await fetch('http://localhost:5000/api/aimachine/process', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command.trim(),
          file: uploadedFile ? {
            name: uploadedFile.name,
            type: uploadedFile.type,
            size: uploadedFile.size
          } : null
        })
      });

      const result = await response.json();

      setCommands(prev => prev.map(cmd =>
        cmd.id === userCommand.id
          ? { ...cmd, response: result.response || result.error }
          : cmd
      ));

    } catch (error) {
      setCommands(prev => prev.map(cmd =>
        cmd.id === userCommand.id
          ? { ...cmd, response: '❌ System error: Unable to process command' }
          : cmd
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-cyan-500');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-cyan-500');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-cyan-500');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-2xl font-mono font-bold mb-2 text-cyan-400">
          ◉ AETHERWAVE AI CREATION MATRIX v2.7
        </h1>
        <div className="flex gap-4 text-sm font-mono items-center">
          <span className="text-green-400">● SYSTEM ONLINE</span>
          <span className="text-cyan-400">AI CORE: ACTIVE</span>
          <span className="text-yellow-400">NEURAL NETWORK: CONNECTED</span>
          {isLoggedIn ? (
            <span className="text-green-400">● AUTHENTICATED</span>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-red-900 text-red-400 px-3 py-1 font-mono text-sm rounded border border-red-500 hover:bg-red-800"
            >
              LOGIN
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Terminal */}
        <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
          <div className="mb-2 font-mono text-sm text-cyan-400">
            ➤ NEURAL INTERFACE TERMINAL
          </div>
          <div
            ref={terminalRef}
            className="bg-black border border-gray-700 rounded p-3 h-96 overflow-y-auto font-mono text-sm"
          >
            {commands.map((cmd) => (
              <div key={cmd.id} className="mb-3">
                {cmd.command && (
                  <div className="text-cyan-400">
                    $ {cmd.command}
                  </div>
                )}
                {cmd.response && (
                  <div className="text-green-400 whitespace-pre-wrap">
                    {cmd.response}
                  </div>
                )}
                <div className="text-gray-500 text-xs mt-1">
                  [{cmd.timestamp.toLocaleTimeString()}]
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="text-yellow-400 animate-pulse">
                ◉ PROCESSING... NEURAL NETWORKS ENGAGED
              </div>
            )}
          </div>

          {/* Command Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCommand(currentCommand)}
              placeholder="Enter command or upload file to analyze..."
              className="flex-1 bg-black border border-green-500 text-green-400 px-3 py-2 font-mono text-sm rounded focus:outline-none focus:border-cyan-400"
              disabled={isProcessing}
            />
            <button
              onClick={() => addCommand(currentCommand)}
              disabled={isProcessing || !currentCommand.trim()}
              className="bg-green-900 text-green-400 px-4 py-2 font-mono text-sm rounded border border-green-500 hover:bg-green-800 disabled:opacity-50"
            >
              EXECUTE
            </button>
          </div>
        </div>

        {/* Right: File Upload Zone */}
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors"
          >
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-mono text-cyan-400 mb-2">
              AUDIO INPUT PORTAL
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Drag & drop audio files or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.flac"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-cyan-900 text-cyan-400 px-6 py-2 font-mono text-sm rounded border border-cyan-500 hover:bg-cyan-800"
            >
              SELECT FILE
            </button>
          </div>

          {/* File Info */}
          {uploadedFile && (
            <div className="bg-gray-900 border border-green-500 rounded-lg p-4">
              <h4 className="text-sm font-mono text-cyan-400 mb-2">
                📁 LOADED FILE
              </h4>
              <div className="text-sm space-y-1">
                <div>Name: <span className="text-green-400">{uploadedFile.name}</span></div>
                <div>Size: <span className="text-green-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span></div>
                <div>Type: <span className="text-green-400">{uploadedFile.type}</span></div>
              </div>
            </div>
          )}

          {/* Quick Commands */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-mono text-cyan-400 mb-3">
              ⚡ QUICK COMMANDS
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => addCommand('generate band from uploaded audio')}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded text-sm font-mono text-green-400"
              >
                generate band from uploaded audio
              </button>
              <button
                onClick={() => addCommand('analyze music and create artist')}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded text-sm font-mono text-green-400"
              >
                analyze music and create artist
              </button>
              <button
                onClick={() => addCommand('create virtual artist profile')}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded text-sm font-mono text-green-400"
              >
                create virtual artist profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}