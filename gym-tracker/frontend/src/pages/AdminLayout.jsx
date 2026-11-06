import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminLayout({ user, onLogout }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const closeMenu = () => setMobileMenuOpen(false);

    return (
        <div className="admin-layout bg-light min-vh-100">
            <button className="admin-mobile-toggle" type="button" aria-label="Toggle navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <span></span><span></span><span></span>
            </button>
            {mobileMenuOpen && <button className="admin-sidebar-backdrop" aria-label="Close navigation" onClick={closeMenu} />}
            <aside className={`admin-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
                <div className="admin-sidebar-brand">
                    <div className="admin-brand-mark">M</div>
                    <div><strong>MOMENTUM</strong><small>GYM MANAGEMENT</small></div>
                </div>
                <div className="admin-sidebar-label">MAIN MENU</div>
                <nav className="admin-sidebar-nav" aria-label="Admin navigation">
                    <NavLink end className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`} to="/admin" onClick={closeMenu}><span className="admin-nav-icon">▦</span><span>Dashboard</span></NavLink>
                    <NavLink className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`} to="/frontdesk" onClick={closeMenu}><span className="admin-nav-icon">⌂</span><span>Front Desk</span></NavLink>
                    <NavLink className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`} to="/admin?view=members" onClick={closeMenu}><span className="admin-nav-icon">♙</span><span>Members</span></NavLink>
                    <NavLink className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`} to="/priceedit" onClick={closeMenu}><span className="admin-nav-icon">₱</span><span>Price Management</span></NavLink>
                </nav>
                <div className="admin-sidebar-bottom">
                    <div className="admin-user-card">
                        <div className="admin-user-avatar">{(user?.email || "A").charAt(0).toUpperCase()}</div>
                        <div className="admin-user-details"><strong>Administrator</strong><small title={user?.email}>{user?.email}</small></div>
                    </div>
                    <button className="admin-logout-link" onClick={onLogout}><span className="admin-nav-icon">↪</span><span>Logout</span></button>
                </div>
            </aside>
            <div className="admin-content"><Outlet /></div>
        </div>
    );
}
