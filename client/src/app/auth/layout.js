
export default function AuthLayout({ children }) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="w-full max-w-3xxl p-8 bg-white rounded-lg shadow-md">
          {children}
        </div>
      </div>
    );
  }