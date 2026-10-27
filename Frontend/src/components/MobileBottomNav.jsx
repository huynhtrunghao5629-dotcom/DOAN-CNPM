import React from 'react';
import { NavLink } from 'react-router-dom';
import './MobileBottomNav.css';

const items = [
  { to: '/home', label: 'Khám phá', icon: '⌂', end: true },
  { to: '/map', label: 'Bản đồ', icon: '⌖', end: false },
  { to: '/destinations', label: 'Di tích', icon: '▦', end: true },
];

export default function MobileBottomNav() {
  return (
    <nav className="huego-mobile-nav" aria-label="Điều hướng du khách trên điện thoại">
      {items.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `huego-mobile-nav__item${isActive ? ' is-active' : ''}`}
        >
          <span className="huego-mobile-nav__icon" aria-hidden="true">{icon}</span>
          <span className="huego-mobile-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
