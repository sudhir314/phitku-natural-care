import React from 'react';

const Story = () => {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Our Story</h1>
        <div className="prose lg:prose-xl mx-auto text-gray-600 space-y-6">
            <p>Phitku isn't just about creating skincare, it's deeply personal. For years, I struggled to find products that truly took care of the skin. I constantly looked for something gentle yet effective that felt luxurious but didn’t come with a hefty price tag.</p>
            <div className="bg-purple-50 p-8 rounded-3xl my-10 border border-purple-100">
                <h3 className="text-2xl font-bold text-purple-900 mb-4">A Note By Founder</h3>
                <p className="italic">"Hi there! Many of you may recognize me from Balika Vadhu... Today, I’m here as the founder of Phitku. I am proud to create a tribe of conscious healers with the aim of promoting true skin beauty and sustainability."</p>
                <p className="font-bold mt-4 text-purple-900">- Neha Marda</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Story;