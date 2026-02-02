'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ProductsPagination({ 
  currentPage, 
  totalPages
}: ProductsPaginationProps) {
  const searchParams = useSearchParams();
  
  // Build pagination URL
  const buildPaginationUrl = (page: number) => {
    const q = new URLSearchParams(searchParams.toString());
    q.set("page", page.toString());
    return `/products?${q.toString()}`;
  };
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5; // Show up to 5 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Show first 3 pages, ellipsis, last page
        for (let i = 2; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show first page, ellipsis, last 3 pages
        pages.push('ellipsis');
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Icon components - matching Figma design
  const FirstIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.5 4L6.5 8L9.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M5.5 4L2.5 8L5.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  const PrevIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  const NextIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  const LastIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 4L9.5 8L6.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M10.5 4L13.5 8L10.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex gap-[5px] items-center justify-center mt-8">
      {/* First Page Button */}
      <Link
        href={buildPaginationUrl(1)}
        className={`bg-[rgba(255,255,255,0.1)] flex items-center justify-center p-[10px] rounded-[32px] shrink-0 size-[56px] transition-all hover:bg-[rgba(255,255,255,0.2)] ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`}
        aria-label="First page"
      >
        <div className="text-[#333]">
          <FirstIcon />
        </div>
      </Link>

      {/* Previous Page Button */}
      <Link
        href={buildPaginationUrl(currentPage - 1)}
        className={`bg-[rgba(255,255,255,0.1)] flex items-center justify-center p-[10px] rounded-[32px] shrink-0 size-[56px] transition-all hover:bg-[rgba(255,255,255,0.2)] ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`}
        aria-label="Previous page"
      >
        <div className="text-[#333]">
          <PrevIcon />
        </div>
      </Link>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <div
              key={`ellipsis-${index}`}
              className="bg-white flex items-center justify-center p-[10px] rounded-[78px] shrink-0 size-[56px]"
            >
              <p className="font-['Open_Sans',sans-serif] font-semibold text-[13px] text-[#333] leading-[normal]">
                ...
              </p>
            </div>
          );
        }

        const isActive = page === currentPage;
        
        return (
          <Link
            key={page}
            href={buildPaginationUrl(page)}
            className={`flex items-center justify-center p-[10px] rounded-[32px] shrink-0 size-[56px] transition-all ${
              isActive
                ? 'bg-[#00d1ff]'
                : 'bg-white hover:bg-gray-50'
            }`}
            aria-label={`Page ${page}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <p
              className={`font-['Open_Sans',sans-serif] leading-[normal] text-[16px] ${
                isActive
                  ? 'font-extrabold text-white'
                  : 'font-semibold text-[#333]'
              }`}
            >
              {page}
            </p>
          </Link>
        );
      })}

      {/* Next Page Button */}
      <Link
        href={buildPaginationUrl(currentPage + 1)}
        className={`bg-[rgba(255,255,255,0.1)] flex items-center justify-center p-[10px] rounded-[32px] shrink-0 size-[56px] transition-all hover:bg-[rgba(255,255,255,0.2)] ${
          currentPage === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`}
        aria-label="Next page"
      >
        <div className="text-[#333]">
          <NextIcon />
        </div>
      </Link>

      {/* Last Page Button */}
      <Link
        href={buildPaginationUrl(totalPages)}
        className={`bg-[rgba(255,255,255,0.1)] flex items-center justify-center p-[10px] rounded-[32px] shrink-0 size-[56px] transition-all hover:bg-[rgba(255,255,255,0.2)] ${
          currentPage === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`}
        aria-label="Last page"
      >
        <div className="text-[#333]">
          <LastIcon />
        </div>
      </Link>
    </div>
  );
}
