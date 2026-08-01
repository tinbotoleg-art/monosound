import React from 'react';
import { X, Share, PlusSquare, Smartphone } from 'lucide-react';

interface InstallInstructionsModalProps {
  onClose: () => void;
}

export const InstallInstructionsModal: React.FC<InstallInstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Установка на iPhone / iPad</h3>
            <p className="text-xs text-zinc-400">Займёт 10 секунд, через браузер Safari</p>
          </div>
        </div>

        <ol className="space-y-3 text-xs text-zinc-300">
          <li className="flex items-start space-x-3 p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg">
            <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span className="flex items-center flex-wrap gap-1">
              Откройте сайт в <strong className="text-white">Safari</strong> и нажмите кнопку
              <Share className="w-3.5 h-3.5 inline text-white mx-0.5" />
              <strong className="text-white">«Поделиться»</strong> внизу экрана
            </span>
          </li>
          <li className="flex items-start space-x-3 p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg">
            <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span className="flex items-center flex-wrap gap-1">
              Выберите
              <PlusSquare className="w-3.5 h-3.5 inline text-white mx-0.5" />
              <strong className="text-white">«На экран «Домой»»</strong>
            </span>
          </li>
          <li className="flex items-start space-x-3 p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg">
            <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>Нажмите <strong className="text-white">«Добавить»</strong> — иконка появится на главном экране, приложение будет открываться без адресной строки</span>
          </li>
        </ol>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Понятно
        </button>
      </div>
    </div>
  );
};
