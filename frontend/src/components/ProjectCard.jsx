import { Link } from 'react-router-dom';
import { formatCurrency, timeAgo, getStatusColor } from '../utils/helpers';
import { HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineTag, HiOutlineChat } from 'react-icons/hi';

const ProjectCard = ({ project }) => {
    return (
        <Link
            to={`/projects/${project._id}`}
            className="glass-card-hover p-6 block group"
            id={`project-card-${project._id}`}
        >
            <div className="flex items-start justify-between mb-3">
                <span className={getStatusColor(project.status)}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                <span className="text-xs t-faint">{timeAgo(project.createdAt)}</span>
            </div>

            <h3 className="text-lg font-semibold t-heading mb-2 group-hover:text-primary-400 transition-colors line-clamp-1">
                {project.title}
            </h3>

            <p className="text-sm t-muted mb-4 line-clamp-2 leading-relaxed">
                {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {project.skills?.slice(0, 3).map((skill, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-subtle t-muted rounded-lg border border-theme">
                        {skill}
                    </span>
                ))}
                {project.skills?.length > 3 && (
                    <span className="text-xs px-2.5 py-1 t-faint">+{project.skills.length - 3}</span>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-theme">
                <div className="flex items-center gap-1 text-sm">
                    <HiOutlineCurrencyDollar className="w-4 h-4 text-accent-400" />
                    <span className="text-accent-400 font-semibold">
                        {formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs t-faint">
                        <HiOutlineChat className="w-3.5 h-3.5" />
                        <span>{project.bidCount || 0} bids</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs t-faint">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        <span>{new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {project.category && (
                <div className="mt-3 flex items-center gap-1">
                    <HiOutlineTag className="w-3.5 h-3.5 text-primary-400" />
                    <span className="text-xs text-primary-400">{project.category}</span>
                </div>
            )}
        </Link>
    );
};

export default ProjectCard;
