import type { UserProfile } from "../api/types";
import { initials } from "../utils/format";

interface AvatarProps {
    user: Pick<UserProfile, "name" | "profilePhoto"> | null;
    size?: "small" | "large";
}

// Avatar del usuario: muestra su foto de perfil si la tiene y, si no, sus iniciales.
export function Avatar({ user, size }: AvatarProps) {
    const className = `avatar${size ? ` avatar--${size}` : ""}`;

    if (user?.profilePhoto) {
        return (
            <span className={className}>
                <img className="avatar__image" src={user.profilePhoto} alt="" />
            </span>
        );
    }

    return <span className={className}>{initials(user?.name ?? "")}</span>;
}