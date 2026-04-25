interface ButtonProps {
  children?: any;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
}

interface CardProps {
  bodyClassName?: string;
  className?: string;
  children?: any;
  title?: string;
  eyebrow?: string;
  action?: any;
}

const buttonClassMap = {
  primary: "ui-button ui-hover-accent ui-button-primary",
  secondary: "ui-button ui-hover-accent ui-button-secondary",
  ghost: "ui-button ui-hover-accent ui-button-ghost",
};

export function Button({
  children,
  href,
  variant = "primary",
}: ButtonProps) {
  if (href) {
    return (
      <a className={buttonClassMap[variant]} href={href}>
        {children}
      </a>
    );
  }

  return <button className={buttonClassMap[variant]}>{children}</button>;
}

export function Card({
  title,
  eyebrow,
  action,
  children,
  className,
  bodyClassName,
}: CardProps) {
  return (
    <section className={className ? `ui-card ${className}` : "ui-card"}>
      {(title || eyebrow || action) && (
        <header className="ui-card-header">
          <div>
            {eyebrow && <p className="ui-card-eyebrow">{eyebrow}</p>}
            {title && <h3 className="ui-card-title">{title}</h3>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName ? `ui-card-body ${bodyClassName}` : "ui-card-body"}>
        {children}
      </div>
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-stat">
      <span className="ui-stat-value">{value}</span>
      <span className="ui-stat-label">{label}</span>
    </div>
  );
}
