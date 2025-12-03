import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Leaf, Heart, Droplet, Award, Zap } from 'lucide-react';
import apiClient from '../api/apiClient'; 

import founderImg from '../assets/founder.webp';
import actionImg from '../assets/action.webp';
import blog1Img from '../assets/blog1.webp'; 
import blog2Img from '../assets/blog2.webp';
import blog3Img from '../assets/blog3.webp';

const blogs = [
    { 
        id: 1,
        title: "What Is Alum and Why Is It Used in Natural Roll-Ons?", 
        summary: "Ancient remedies like phitkari (alum) have always had a place in Indian households, but now they’re making their way back...",
        image: blog1Img 
    },
    { 
        id: 2,
        title: "How Long Does a Roll-On Last? Everything You Need to Know", 
        summary: "We all want products that last, not ones that vanish before the month ends. Deodorant sprays? They disappear into thin air...",
        image: blog2Img
    },
    { 
        id: 3,
        title: "The Hidden Chemicals in Deodorants You Should Avoid", 
        summary: "That citrusy, fruity deodorant you swear by? It might smell amazing, but behind the fresh notes could be a cocktail of hidden chemicals...",
        image: blog3Img
    }
];

const Home = ({ addToCart }) => {
  const navigate = useNavigate(); 
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/products');
        setProducts(res.data.slice(0, 4)); 
      } catch (err) {
        console.error("Failed to load home products", err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      
      {/* 1. HERO BANNER */}
      <div className="bg-gradient-to-br from-white via-green-50 to-blue-50 relative py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
            
            <div className="md:w-1/2 max-w-xl mb-8 md:mb-0 text-center md:text-left z-10">
                <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-green-600 mb-3 block">
                    100% Natural, 100% Protection
                </span>
                <h2 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight text-gray-900">
                  The Purity of Crystal Care, <span className="text-green-700">Naturally.</span>
                </h2>
                <p className="text-base md:text-lg text-gray-600 mb-8 font-light leading-relaxed">
                  Harness the power of mineral alum for 24-hour protection against odor, sweat, and irritation. Gentle on skin, tough on toxins.
                </p>
                <Link to="/shop">
                    <button className="bg-green-700 text-white px-8 py-3 rounded-full font-bold text-base md:text-lg hover:bg-green-800 transition transform hover:scale-105 shadow-xl flex items-center justify-center mx-auto md:mx-0 gap-3">
                        Discover Our Products <ArrowRight size={20} />
                    </button>
                </Link>
            </div>

            <div className="md:w-1/2 relative flex justify-center items-center h-64 md:h-[350px] w-full">
                <svg className="w-full h-full max-w-sm text-green-300/50" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 0L85 30V70L50 100L15 70V30L50 0Z" opacity="0.6"/>
                    <path d="M50 10L90 40C85 80 50 90 50 90C50 90 15 80 10 40L50 10Z" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
                    <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="1" opacity="0.7"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-12 h-12 md:w-16 md:h-16 text-green-700/80 animate-pulse" />
                </div>
            </div>
        </div>
        
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      {/* 2. BENEFITS */}
      <div className="bg-gray-900 text-white py-6 border-t border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-center text-[10px] md:text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2 text-green-400"><ShieldCheck size={16}/> Zero Toxins</span>
                <span className="flex items-center gap-2 text-pink-400"><Heart size={16}/> Cruelty Free</span>
                <span className="flex items-center gap-2 text-blue-400"><Award size={16}/> Derm Tested</span>
                <span className="flex items-center gap-2 text-green-400"><Leaf size={16}/> Chemical Free</span>
            </div>
          </div>
      </div>

      {/* 3. BEST SELLERS (Linked to Details Page) */}
      <div className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Best Sellers</h2>
                <p className="text-gray-600">Favorites from our tribe</p>
            </div>
            
            <div className="w-full max-w-7xl mx-auto">
                {products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                      {products.map(product => (
                          <Link to={`/product/${product._id}`} key={product._id} className="group cursor-pointer flex flex-col h-full">
                              <div className={`relative aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3 transition duration-500 group-hover:shadow-lg`}>
                                  {product.tag && (
                                    <span className="absolute top-3 left-3 bg-black/90 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide z-10">
                                      {product.tag}
                                    </span>
                                  )}
                                  
                                  <div className="absolute top-3 right-3 flex items-center gap-0.5 text-yellow-500 bg-white/80 px-1.5 py-0.5 rounded-full z-10">
                                      <span className="text-xs font-bold">{product.rating || 5}</span>
                                      <Star size={10} fill="currentColor" />
                                  </div>
                                  
                                  {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition">
                                        <Droplet size={48} className="text-gray-600/20" />
                                    </div>
                                  )}
                                  
                                  {/* Prevent Link Navigation on Add Cart Click */}
                                  <div className="absolute bottom-3 left-3 right-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                      <button 
                                        onClick={(e) => { e.preventDefault(); addToCart && addToCart(product); }} 
                                        className="w-full bg-white text-black text-xs md:text-sm font-bold py-2 md:py-3 rounded-xl shadow-md hover:bg-black hover:text-white transition"
                                      >
                                        Add to Cart
                                      </button>
                                  </div>
                              </div>
                              
                              <div className="mt-auto">
                                  <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1 leading-tight line-clamp-2">{product.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                      <span className="text-gray-900 font-bold text-base md:text-lg">Rs. {product.price}</span>
                                      {product.originalPrice && (
                                        <span className="text-gray-400 line-through text-xs md:text-sm">Rs. {product.originalPrice}</span>
                                      )}
                                  </div>
                              </div>
                          </Link>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Loading best sellers...</p>
                  </div>
                )}
            </div>
            
            <div className="text-center mt-10">
                <Link to="/shop" className="inline-block border-b-2 border-black pb-1 text-black font-bold text-sm md:text-base hover:text-green-700 hover:border-green-700 transition">
                    View All Products
                </Link>
            </div>
        </div>
      </div>

      {/* 4. WHY PHITKU */}
      <div className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 text-center max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Why Phitku?</h2>
              <p className="text-gray-600 mb-6 text-lg md:text-xl leading-relaxed font-light">
                  Our mission is to make <span className="text-black font-medium">100% natural, gentle, and affordable skincare</span> accessible to everyone.
              </p>
              <Link to="/story" className="text-green-700 font-bold hover:underline">Read Our Story</Link>
          </div>
      </div>

      {/* 5. PHITKU IN ACTION */}
      <div className="bg-white py-12 md:py-20 overflow-hidden">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <div className="md:w-1/2 z-10 text-center md:text-left">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-gray-900">
                    No more body odour, <br/> <span className="text-green-700">Just Freshness.</span>
                  </h2>
                  <p className="text-gray-600 mb-6 text-base md:text-lg leading-relaxed">
                      Meet the Forever Fresh Crystal Deodorant. It keeps you feeling fresh and fabulous, no matter what life throws your way.
                  </p>
                  <Link to="/shop">
                      <button className="bg-green-700 text-white px-8 py-3 rounded-full font-bold hover:bg-green-800 transition shadow-lg">
                        Shop Now
                      </button>
                  </Link>
              </div>
              <div className="md:w-1/2 w-full relative">
                   <div className="absolute -inset-4 bg-green-200 rounded-[2rem] rotate-3 opacity-30 blur-xl"></div>
                   <div className="relative h-64 md:h-[400px] w-full rounded-2xl overflow-hidden shadow-xl">
                       <img src={actionImg} alt="Phitku In Action" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
                   </div>
              </div>
          </div>
        </div>

      {/* 6. FOUNDER'S NOTE */}
      <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl flex flex-col-reverse md:flex-row gap-10 items-center">
              <div className="md:w-1/3 w-full relative px-6 md:px-0">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border-4 border-white rotate-[-2deg] hover:rotate-0 transition duration-500">
                      <img src={founderImg} alt="Founder" className="w-full h-full object-cover" />
                  </div>
              </div>
              <div className="md:w-2/3 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-6 text-gray-900">A Note From The Founder</h2>
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-600 italic text-lg leading-relaxed mb-4">
                        "Amidst the daily hustle, skincare struggles should be the last thing on your mind. That’s why #LetsPhitku."
                    </p>
                    <p className="font-bold text-gray-900">- Neha Marda</p>
                  </div>
              </div>
          </div>
        </div>

      {/* 7. BLOGS SECTION */}
      <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-2">Our Blogs</h2>
              <p className="text-center text-gray-500 mb-10">Latest stories & tips</p>
              
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                  {blogs.map((blog) => (
                      <div key={blog.id} onClick={() => navigate(`/blog/${blog.id}`)} className="group cursor-pointer">
                          <div className="aspect-video rounded-xl mb-4 overflow-hidden shadow-sm">
                              <img src={blog.image} alt={blog.title} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" />
                          </div>
                          <h3 className="font-bold text-lg mb-2 group-hover:text-green-700 transition leading-snug">{blog.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{blog.summary}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>

    </div>
  );
};

export default Home;