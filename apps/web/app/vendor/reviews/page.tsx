import { Star } from 'lucide-react';

const reviews = [
  { id: 'R-501', customer: 'Rahul Sharma', listing: 'Golden Triangle Tour', rating: 5, comment: 'Amazing experience, highly recommended!', date: '28 Jun 2026' },
  { id: 'R-502', customer: 'Priya Patel', listing: 'Kerala Houseboat Stay', rating: 4, comment: 'Great service but pickup was delayed.', date: '27 Jun 2026' },
  { id: 'R-503', customer: 'Amit Kumar', listing: 'Golden Triangle Tour', rating: 5, comment: 'Best tour guide we ever had.', date: '26 Jun 2026' },
  { id: 'R-504', customer: 'Sneha Gupta', listing: 'Goa Beach Resort', rating: 3, comment: 'Average stay, expected better cleanliness.', date: '25 Jun 2026' },
];

export default function VendorReviewsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-cloud">Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass p-5 text-center">
          <p className="text-3xl font-bold text-cloud">4.8</p>
          <p className="text-cloud/50 text-sm">Average Rating</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-bold text-cloud">128</p>
          <p className="text-cloud/50 text-sm">Total Reviews</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="text-3xl font-bold text-emerald">92%</p>
          <p className="text-cloud/50 text-sm">Would Recommend</p>
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="glass p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-cloud font-medium">{review.customer}</p>
                <p className="text-cloud/50 text-xs">{review.listing}</p>
              </div>
              <span className="text-cloud/40 text-xs">{review.date}</span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < review.rating ? 'text-saffron fill-saffron' : 'text-cloud/20'}`}
                />
              ))}
            </div>
            <p className="text-cloud/70 text-sm">&ldquo;{review.comment}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  );
}
