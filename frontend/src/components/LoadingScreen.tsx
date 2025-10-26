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
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-4">
          ⚙️ Indexing your codebase
        </h2>

        <p className="text-center text-sm text-gray-500 mt-8">
          This usually takes up to 2 minutes.
        </p>
      </div>
    </div>
  );
}
