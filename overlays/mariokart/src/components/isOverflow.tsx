import React from "react";

export const useIsOverflow = (
  ref: React.RefObject<HTMLDivElement>,
  callback: (isOverflow: boolean) => void,
  deps: any[] = []
) => {
  const [isOverflow, setIsOverflow] = React.useState(false);

  React.useLayoutEffect(() => {
    const current = ref.current;
    if (!current) return;

    const trigger = () => {
      const totalChildrenHeight = Array.from(current.children).reduce(
        (sum, child) => {
          const el = child as HTMLElement;
          const styles = getComputedStyle(el);
          const marginTop = parseFloat(styles.marginTop) || 0;
          const marginBottom = parseFloat(styles.marginBottom) || 0;
          return sum + el.offsetHeight + marginTop + marginBottom;
        },
        0
      );
      
      // take gaps into account
      const styles = getComputedStyle(current);
      const gap = parseFloat(styles.rowGap) || 0; // or columnGap if horizontal
      const totalGap = (current.children.length - 1) * gap;

      const hasOverflow = totalChildrenHeight + totalGap > current.clientHeight;
      setIsOverflow(hasOverflow);
      callback?.(hasOverflow);
    };

    trigger();

    const resizeObserver = new ResizeObserver(trigger);
    resizeObserver.observe(current);

    return () => resizeObserver.disconnect();
  }, [callback, ref, ...deps]);

  return isOverflow;
};
