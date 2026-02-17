import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { categories } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const CreateProject = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        skills: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                title: form.title,
                description: form.description,
                category: form.category,
                skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
                budget: { min: Number(form.budgetMin), max: Number(form.budgetMax) },
                deadline: form.deadline,
            };

            const { data } = await API.post('/projects', payload);
            toast.success('Project created successfully!');
            navigate(`/projects/${data.project._id}`);
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to create project';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 t-muted hover:t-heading transition-colors mb-6">
                <HiOutlineArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="max-w-3xl mx-auto">
                <div className="glass-card p-6 sm:p-10">
                    <h1 className="text-2xl sm:text-3xl font-bold t-heading mb-2">Create New Project</h1>
                    <p className="t-muted mb-8">Describe your project to attract the best freelancers</p>

                    <form onSubmit={handleSubmit} className="space-y-6" id="create-project-form">
                        <div>
                            <label className="label-text">Project Title</label>
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g. E-commerce Website Redesign"
                                required
                                id="project-title"
                            />
                        </div>

                        <div>
                            <label className="label-text">Description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                className="input-field min-h-[180px] resize-none"
                                placeholder="Describe your project in detail. What are your goals, requirements, and expectations?"
                                required
                                id="project-description"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Category</label>
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                    id="project-category"
                                >
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label-text">Required Skills</label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={form.skills}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="React, Node.js, MongoDB"
                                    id="project-skills"
                                />
                                <p className="text-xs t-faint mt-1">Comma-separated</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="label-text">Min Budget ($)</label>
                                <input
                                    type="number"
                                    name="budgetMin"
                                    value={form.budgetMin}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="500"
                                    required
                                    min="1"
                                    id="project-budget-min"
                                />
                            </div>

                            <div>
                                <label className="label-text">Max Budget ($)</label>
                                <input
                                    type="number"
                                    name="budgetMax"
                                    value={form.budgetMax}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="2000"
                                    required
                                    min="1"
                                    id="project-budget-max"
                                />
                            </div>

                            <div>
                                <label className="label-text">Deadline</label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={form.deadline}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                    id="project-deadline"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1 flex items-center justify-center"
                                id="project-submit"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Create Project'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateProject;
