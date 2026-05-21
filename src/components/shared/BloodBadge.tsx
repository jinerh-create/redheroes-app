interface Props { type: string; outline?: boolean; }

export default function BloodBadge({ type, outline }: Props) {
  return (
    <span className={`blood-badge${outline ? ' blood-badge-outline' : ''}`}>{type}</span>
  );
}
