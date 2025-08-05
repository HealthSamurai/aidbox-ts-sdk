import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

export const SimplePagination: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

export const WithEllipsis: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">8</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            9
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">10</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">19</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">20</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(5);
    const totalPages = 20;

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    const renderPageNumbers = () => {
      const pages = [];
      const showEllipsis = totalPages > 7;
      
      if (!showEllipsis) {
        // Show all pages if 7 or fewer
        for (let i = 1; i <= totalPages; i++) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink 
                href="#"
                isActive={i === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(i);
                }}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      } else {
        // Always show first page
        pages.push(
          <PaginationItem key={1}>
            <PaginationLink 
              href="#"
              isActive={1 === currentPage}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );

        // Show ellipsis after first page if current page is far from start
        if (currentPage > 4) {
          pages.push(
            <PaginationItem key="ellipsis-start">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }

        // Show pages around current page
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
          if (i !== 1 && i !== totalPages) {
            pages.push(
              <PaginationItem key={i}>
                <PaginationLink 
                  href="#"
                  isActive={i === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(i);
                  }}
                >
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }

        // Show ellipsis before last page if current page is far from end
        if (currentPage < totalPages - 3) {
          pages.push(
            <PaginationItem key="ellipsis-end">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }

        // Always show last page
        if (totalPages > 1) {
          pages.push(
            <PaginationItem key={totalPages}>
              <PaginationLink 
                href="#"
                isActive={totalPages === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(totalPages);
                }}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      return pages;
    };

    return (
      <div className="space-y-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    handlePageChange(currentPage - 1);
                  }
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {renderPageNumbers()}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    handlePageChange(currentPage + 1);
                  }
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  },
};

export const FirstPage: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious className="pointer-events-none opacity-50" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">10</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};

export const LastPage: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">8</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">9</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            10
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext className="pointer-events-none opacity-50" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};