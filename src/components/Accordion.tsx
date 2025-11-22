import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function Accordion({
  title,
  icon,
  headerActions,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={styles.accordion}>
      <div
        style={{
          ...styles.header,
          backgroundColor: open ? "var(--bg-tertiary)" : "transparent",
        }}
      >
        <button
          style={styles.headerButton}
          onClick={() => setOpen(!open)}
        >
          {icon && <span style={styles.icon}>{icon}</span>}
          <span>{title}</span>
          <ChevronRight
            size={14}
            style={{
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
        
        {headerActions && (
          <div style={styles.headerActions} onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </div>
        )}
      </div>

      <div
        style={{
          ...styles.body,
          maxHeight: open ? "1000px" : "0",
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  accordion: {
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    marginBottom: "12px",
    backgroundColor: "var(--bg-secondary)",
    boxShadow: "0 1px 2px var(--shadow)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "10px 14px",
  },
  headerButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-primary)",
    cursor: "pointer",
    border: "none",
    background: "none",
    padding: 0,
    textAlign: "left",
  },
  icon: {
    display: "flex",
    alignItems: "center",
    color: "var(--text-secondary)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  body: {
    padding: "8px",
  },
};
