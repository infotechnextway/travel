import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/price_tag.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _showFilters = false;
  String _selectedSort = 'relevance';
  RangeValues _priceRange = const RangeValues(1000, 50000);
  final List<String> _selectedTypes = [];

  final List<Map<String, dynamic>> results = [
    {
      'title': 'Leh Ladakh Bike Expedition',
      'location': 'Leh, Ladakh',
      'image': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600',
      'rating': 4.9,
      'reviews': 456,
      'price': 45000.0,
      'duration': '7 days',
      'type': 'tour',
    },
    {
      'title': 'Goa Beach Villa',
      'location': 'Anjuna, Goa',
      'image': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600',
      'rating': 4.7,
      'reviews': 234,
      'price': 8500.0,
      'duration': 'per night',
      'type': 'hotel',
    },
    {
      'title': 'Rishikesh River Rafting',
      'location': 'Rishikesh, Uttarakhand',
      'image': 'https://images.unsplash.com/photo-1530866495561-507c9faab2e4?w=600',
      'rating': 4.8,
      'reviews': 678,
      'price': 2500.0,
      'duration': '1 day',
      'type': 'activity',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.midnight,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: AppColors.cloud),
                      decoration: InputDecoration(
                        hintText: 'Search destinations, tours...',
                        prefixIcon: const Icon(Icons.search, color: AppColors.cloudDim),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _showFilters ? Icons.filter_list_off : Icons.filter_list,
                            color: AppColors.sand,
                          ),
                          onPressed: () => setState(() => _showFilters = !_showFilters),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_showFilters) _buildFilters(),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: results.length,
                itemBuilder: (context, index) => _buildResultCard(results[index]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Price Range', style: TextStyle(color: AppColors.cloud.withOpacity(0.7), fontSize: 13)),
          RangeSlider(
            values: _priceRange,
            min: 0,
            max: 100000,
            divisions: 20,
            activeColor: AppColors.sand,
            inactiveColor: AppColors.glassBorder,
            labels: RangeLabels(
              '₹${_priceRange.start.round()}',
              '₹${_priceRange.end.round()}',
            ),
            onChanged: (values) => setState(() => _priceRange = values),
          ),
          const SizedBox(height: 8),
          Text('Type', style: TextStyle(color: AppColors.cloud.withOpacity(0.7), fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: ['Tour', 'Activity', 'Hotel', 'Transport'].map((type) {
              final isSelected = _selectedTypes.contains(type);
              return FilterChip(
                label: Text(type),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedTypes.add(type);
                    } else {
                      _selectedTypes.remove(type);
                    }
                  });
                },
                backgroundColor: AppColors.glassWhite,
                selectedColor: AppColors.sand.withOpacity(0.3),
                checkmarkColor: AppColors.sand,
                labelStyle: TextStyle(
                  color: isSelected ? AppColors.sand : AppColors.cloud.withOpacity(0.7),
                  fontSize: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isSelected ? AppColors.sand : AppColors.glassBorder),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> item) {
    return GlassCard(
      onTap: () {},
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: IntrinsicHeight(
          child: Row(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
                child: Image.network(
                  item['image'] as String,
                  width: 120,
                  height: 140,
                  fit: BoxFit.cover,
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'] as String,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.cloud),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 12, color: AppColors.cloud.withOpacity(0.5)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              item['location'] as String,
                              style: TextStyle(fontSize: 12, color: AppColors.cloud.withOpacity(0.5)),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          const Icon(Icons.star, color: AppColors.sand, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '${item['rating']}',
                            style: const TextStyle(color: AppColors.cloud, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            ' (${item['reviews']})',
                            style: TextStyle(fontSize: 11, color: AppColors.cloud.withOpacity(0.4)),
                          ),
                          const Spacer(),
                          PriceTag(amount: item['price'] as double),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
