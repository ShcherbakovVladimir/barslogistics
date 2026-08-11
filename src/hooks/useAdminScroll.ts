import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAdminScroll, type AdminSection } from '../store/adminSlice';

/** Persist and restore scroll position per admin section on `[data-admin-scroll]`. */
export function useAdminScroll(section: AdminSection): void {
  const dispatch = useAppDispatch();
  const scrollBySection = useAppSelector(state => state.admin.scrollBySection);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const sectionRef = useRef(section);
  const scrollBySectionRef = useRef(scrollBySection);

  sectionRef.current = section;
  scrollBySectionRef.current = scrollBySection;

  useEffect(() => {
    scrollElRef.current = document.querySelector('[data-admin-scroll]');
  }, []);

  useEffect(() => {
    const el = scrollElRef.current ?? document.querySelector('[data-admin-scroll]');
    scrollElRef.current = el as HTMLElement | null;
    if (!el) return;
    el.scrollTop = scrollBySectionRef.current[section] ?? 0;
  }, [section]);

  useEffect(() => {
    const el = scrollElRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        dispatch(setAdminScroll({ section: sectionRef.current, scrollTop: el.scrollTop }));
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [dispatch, section]);
}

export function saveAdminScrollBeforeSectionChange(
  currentSection: AdminSection,
  dispatch: ReturnType<typeof useAppDispatch>,
): void {
  const el = document.querySelector('[data-admin-scroll]');
  if (!el) return;
  dispatch(setAdminScroll({ section: currentSection, scrollTop: el.scrollTop }));
}
