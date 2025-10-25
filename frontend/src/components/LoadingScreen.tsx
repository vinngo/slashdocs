// components/LoadingScreen.tsx
interface LoadingScreenProps {
  status: {
    status: string;
    progress: number;
    message: string;
  };
}

export default function LoadingScreen({ status }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="inline-block">
            {/* Animated spinner */}
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-4">
          ⚙️ Indexing your codebase
        </h2>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${status.progress}%` }}
          />
        </div>

        {/* Status message */}
        <div className="space-y-2 text-center text-gray-600">
          <p className="font-medium">{status.message}</p>

          {status.progress < 30 && (
            <p className="text-sm">📂 Parsing code files...</p>
          )}
          {status.progress >= 30 && status.progress < 70 && (
            <p className="text-sm">🧠 Generating embeddings...</p>
          )}
          {status.progress >= 70 && status.progress < 100 && (
            <p className="text-sm">💾 Storing in ChromaDB...</p>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          This usually takes 20-40 seconds
        </p>
      </div>
    </div>
  );
}
