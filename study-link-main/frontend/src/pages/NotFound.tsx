import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="mt-2">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="font-medium hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
