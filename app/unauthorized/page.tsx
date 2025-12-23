export default function UnauthorizedPage() {
 return (
 <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center">
 <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h1>
 <p className="text-gray-600 mb-6">
 You don’t have permission to view this page.
 </p>
 <a
 href="/login"
 className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
 >
 Go back to Login
 </a>
 </div>
 )
}
