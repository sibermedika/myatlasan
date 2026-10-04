import React from 'react';
import AccountDialog from './AccountDialog';
import {UserRole,UserProfile} from '../types';
// Compatibility wrapper: all authentication is delegated to the server.
export default function SecretAdminModal(p:{currentRole?:UserRole;currentUser?:UserProfile|null;onClose:()=>void;onLoginSuccess:(user:UserProfile)=>void;onLogout?:()=>void;theme:'dark'|'light'}){return <AccountDialog {...p} currentRole={p.currentRole || 'GUEST'} onLoginSuccess={async user=>{await p.onLoginSuccess(user);}}/>;}
