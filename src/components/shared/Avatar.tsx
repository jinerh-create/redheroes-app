interface Props {
  name: string;
  avatar_b64?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Avatar({ name, avatar_b64, size = 'md' }: Props) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  if (avatar_b64) {
    const src = avatar_b64.startsWith('data:') ? avatar_b64 : `data:image/jpeg;base64,${avatar_b64}`;
    return <img src={src} alt={name} className={`avatar avatar-${size}`} />;
  }
  return (
    <div className={`avatar avatar-${size}`} style={{ background: 'var(--surface2)', border: '1.5px solid var(--border-red)' }}>
      {initials}
    </div>
  );
}
