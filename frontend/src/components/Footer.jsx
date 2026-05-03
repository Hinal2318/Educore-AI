import { Link } from 'react-router-dom';
import { Globe, MessageCircle, Share2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Globe size={20} />, href: '#', label: 'Website' },
    { icon: <MessageCircle size={20} />, href: '#', label: 'Community' },
    { icon: <Share2 size={20} />, href: '#', label: 'Socials' },
    { icon: <Mail size={20} />, href: '#', label: 'Email' },
  ];

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Faculty Portal', path: '/faculty' },
    { name: 'Student Portal', path: '/student' },
    { name: 'AI Chat', path: '/chat' },
  ];

  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🎓</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                Educore AI
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
              Empowering education with AI. Upload course materials to instantly generate MCQs and provide a dedicated AI tutor for your students.
            </p>
            <div className="flex gap-4 pt-2">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:bg-indigo-600 hover:text-gray-900 dark:text-white transition-colors"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-gray-900 dark:text-white font-semibold tracking-wide uppercase text-sm">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm hover:text-indigo-400 transition-colors inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Resources */}
          <div className="space-y-4">
            <h3 className="text-gray-900 dark:text-white font-semibold tracking-wide uppercase text-sm">Resources</h3>
            <ul className="space-y-2">
              {['Documentation', 'API Reference', 'Privacy Policy', 'Terms of Service'].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm hover:text-indigo-400 transition-colors inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 dark:text-gray-500 text-sm">
            © {currentYear} Educore AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-500">
            <span>Built with</span>
            <span className="text-red-500 animate-pulse">❤️</span>
            <span>for Education</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
