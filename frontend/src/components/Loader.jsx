const Loader = ({ size = 'md', text = '' }) => {
    const sizes = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
                <div className={`${sizes[size]} border-2 border-theme border-t-primary-500 rounded-full animate-spin`}></div>
                <div className={`absolute inset-0 ${sizes[size]} border-2 border-transparent border-b-accent-500 rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            {text && <p className="text-sm t-muted animate-pulse">{text}</p>}
        </div>
    );
};

export default Loader;
