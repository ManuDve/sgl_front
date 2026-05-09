export default function LogoutButton() {
  function handleLogout() {
    localStorage.removeItem("sgl_token");
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="border border-sgl-gold text-sgl-gold hover:bg-sgl-gold hover:text-sgl-black font-semibold px-4 py-2 rounded text-sm transition-colors duration-200"
    >
      Cerrar sesión
    </button>
  );
}
