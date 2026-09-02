class AdminEventsManager {
    constructor() {
        this.events = [];
        this.currentAdmin = null;
        this.editRequiredSkills = [];
        this.interestsData = this.getInterestsData();
    }

    getInterestsData() {
        return {
            "education": {
                name: "Education & Training",
                skills: ["Teaching & Tutoring", "Public Speaking", "Writing", "Editing"]
            },
            "technology": {
                name: "Technology & Digital Services", 
                skills: ["Web Development", "Graphic Design", "Social Media Management", "IT Support & Troubleshooting", "Robotics", "Coding Instruction"]
            },
            "community": {
                name: "Community Service",
                skills: ["Event Planning", "Fundraising", "Community Organizing", "Research & Documentation", "Translation", "Interpretation"]
            },
            "disaster": {
                name: "Disaster Relief & Humanitarian Aid",
                skills: ["First Aid & Medical Assistance", "Disaster Response", "Relief Operations", "Construction & Carpentry", "Cooking & Food Preparation"]
            },
            "health": {
                name: "Health & Well-being",
                skills: ["Counseling & Mental Health Support", "Sports & Fitness Coaching", "Nursing & Patient Care", "Public Health & Disease Prevention"]
            },
            "environment": {
                name: "Environmental & Sustainability",
                skills: ["Agriculture & Gardening", "Wildlife & Animal Care", "Recycling & Waste Management", "Disaster Resilience & Risk Reduction"]
            },
            "legal": {
                name: "Legal & Advocacy", 
                skills: ["Legal Assistance & Paralegal Support", "Human Rights Advocacy", "Mediation & Conflict Resolution"]
            },
            "arts": {
                name: "Arts, Culture & Media",
                skills: ["Photography", "Videography", "Music & Performing Arts", "Illustration & Animation", "Content Creation", "Blogging"]
            },
            "stem": {
                name: "STEM & Research",
                skills: ["Data Analysis & Research", "Engineering & Technical Support"]
            },
            "social": {
                name: "Social & Humanitarian Work",
                skills: ["Crisis Intervention & Peer Counseling", "Accessibility & Disability Rights"]
            }
        };
    }

    init(currentAdmin) {
        this.currentAdmin = currentAdmin;
        this.setupEventListeners();
        this.setupRealTimeListeners();
        this.setupEditSkillsManagement();
        this.populateSkillsDropdown();
    }

    setupEventListeners() {
        // Search and filter
        const searchInput = document.getElementById('eventSearch');
        const filterSelect = document.getElementById('eventFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', AdminUtils.debounce(() => this.filterEvents(), 300));
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterEvents());
        }

        // Edit form submission
        document.getElementById('editEventForm').addEventListener('submit', (e) => this.handleEditEvent(e));
    }

    setupEditSkillsManagement() {
        const editSkillsDropdown = document.getElementById('editEventSkillsDropdown');
        const editSkillsDropdownContent = document.getElementById('editEventSkillsDropdownContent');
        
        if (!editSkillsDropdown) return;

        // Toggle dropdown for EDIT modal
        editSkillsDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !editSkillsDropdownContent.classList.contains('hidden');
            
            if (!isOpen) {
                editSkillsDropdownContent.classList.remove('hidden');
                editSkillsDropdown.classList.add('border-primary');
            } else {
                editSkillsDropdownContent.classList.add('hidden');
                editSkillsDropdown.classList.remove('border-primary');
            }
        });
        
        // Prevent dropdown from closing when clicking inside
        editSkillsDropdownContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!editSkillsDropdown.contains(e.target) && !editSkillsDropdownContent.contains(e.target)) {
                editSkillsDropdownContent.classList.add('hidden');
                editSkillsDropdown.classList.remove('border-primary');
            }
        });
        
        // Select All / Deselect All functionality for EDIT modal
        document.getElementById('editSelectAllSkills')?.addEventListener('click', () => {
            document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    this.addEditSkillChip(checkbox.value);
                }
            });
        });
        
        document.getElementById('editDeselectAllSkills')?.addEventListener('click', () => {
            document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    this.removeEditSkillChip(checkbox.value);
                }
            });
        });
    }

    populateSkillsDropdown() {
        const dropdownContent = document.getElementById('editEventSkillsDropdownContent');
        if (!dropdownContent) return;

        const skillsContainer = dropdownContent.querySelector('.grid');
        if (!skillsContainer) return;

        // Get all unique skills from all categories
        const allSkills = [];
        Object.values(this.interestsData).forEach(category => {
            category.skills.forEach(skill => {
                if (!allSkills.includes(skill)) {
                    allSkills.push(skill);
                }
            });
        });

        // Sort skills alphabetically
        allSkills.sort();

        // Populate skills checkboxes
        skillsContainer.innerHTML = allSkills.map(skill => `
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" value="${skill}" class="skill-checkbox rounded border-gray-300 text-primary focus:ring-primary">
                <span class="text-sm text-gray-700">${skill}</span>
            </label>
        `).join('');

        // Add event listeners to checkboxes
        document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.addEditSkillChip(e.target.value);
                } else {
                    this.removeEditSkillChip(e.target.value);
                }
            });
        });
    }

    addEditSkillChip(skill) {
        if (!this.editRequiredSkills.includes(skill)) {
            this.editRequiredSkills.push(skill);
            this.updateEditSelectedSkillsChips();
        }
    }

    removeEditSkillChip(skill) {
        this.editRequiredSkills = this.editRequiredSkills.filter(s => s !== skill);
        this.updateEditSelectedSkillsChips();
        
        // Uncheck the corresponding checkbox
        const checkbox = document.querySelector(`#editEventSkillsDropdownContent .skill-checkbox[value="${skill}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    updateEditSelectedSkillsChips() {
        const container = document.getElementById('editSelectedEventSkills');
        const placeholder = document.getElementById('editEventSkillsPlaceholder');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.editRequiredSkills.length > 0) {
            placeholder.classList.add('hidden');
        } else {
            placeholder.classList.remove('hidden');
        }
        
        this.editRequiredSkills.forEach(skill => {
            const chip = document.createElement('div');
            chip.className = 'skill-chip';
            chip.innerHTML = `
                ${skill}
                <button type="button" class="skill-chip-remove" data-skill="${skill}">
                    <i data-feather="x" class="w-3 h-3"></i>
                </button>
            `;

            container.appendChild(chip);
            
            // Add remove event listener
            const removeBtn = chip.querySelector('.skill-chip-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeEditSkillChip(skill);
                container.removeChild(chip);
            });
        });
        
        feather.replace();
    }

    clearEditSkills() {
        this.editRequiredSkills = [];
        this.updateEditSelectedSkillsChips();
        
        // Uncheck all checkboxes in EDIT modal
        document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    setupRealTimeListeners() {
        // Real-time listener for all events
        db.collection('events').onSnapshot((snapshot) => {
            this.events = [];
            snapshot.forEach(doc => {
                this.events.push({ id: doc.id, ...doc.data() });
            });
            this.loadEvents();
        }, (error) => {
            console.error('Error listening to events:', error);
        });
    }

    loadEvents() {
        const eventsList = document.getElementById('eventsList');
        
        if (this.events.length === 0) {
            eventsList.innerHTML = this.getEmptyStateHTML('calendar', 'No events found');
        } else {
            eventsList.innerHTML = this.events.map(event => 
                this.createEventCard(event)
            ).join('');
        }
        feather.replace();
    }

    filterEvents() {
        const searchTerm = document.getElementById('eventSearch').value.toLowerCase();
        const filterValue = document.getElementById('eventFilter').value;
        
        let filteredEvents = this.events;
        
        // Apply status filter
        if (filterValue !== 'all') {
            filteredEvents = filteredEvents.filter(event => 
                event.status === filterValue
            );
        }
        
        // Apply search filter
        if (searchTerm) {
            filteredEvents = filteredEvents.filter(event => {
                const eventName = event.name ? event.name.toLowerCase() : '';
                const description = event.description ? event.description.toLowerCase() : '';
                const location = event.location ? event.location.toLowerCase() : '';
                const organizer = event.organizerName ? event.organizerName.toLowerCase() : '';
                const refNumber = event.refNumber ? event.refNumber.toString() : '';
                
                return eventName.includes(searchTerm) || 
                       description.includes(searchTerm) || 
                       location.includes(searchTerm) ||
                       organizer.includes(searchTerm) ||
                       refNumber.includes(searchTerm);
            });
        }
        
        const eventsList = document.getElementById('eventsList');
        if (filteredEvents.length === 0) {
            eventsList.innerHTML = this.getEmptyStateHTML('calendar', 'No events match your criteria');
        } else {
            eventsList.innerHTML = filteredEvents.map(event => 
                this.createEventCard(event)
            ).join('');
        }
        feather.replace();
    }

    createEventCard(event) {
        const startTime = AdminUtils.formatDate(event.startTime);
        const endTime = AdminUtils.formatDate(event.endTime);
        const statusBadge = AdminUtils.getStatusBadge(event.status || 'pending');
        const volunteersText = `${event.currentVolunteers || 0}/${event.maxVolunteers || 0} volunteers`;

        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-3">
                            <h4 class="font-semibold text-gray-800 text-lg">${event.name}</h4>
                            <span class="text-sm text-gray-500">#${event.refNumber || 'N/A'}</span>
                        </div>
                        
                        <p class="text-gray-600 text-sm mb-3">${event.description || 'No description'}</p>
                        
                        ${event.requiredSkills && event.requiredSkills.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mb-3">
                                ${event.requiredSkills.slice(0, 3).map(skill => 
                                    `<span class="skill-chip">${skill}</span>`
                                ).join('')}
                                ${event.requiredSkills.length > 3 ? 
                                    `<span class="text-xs text-gray-500">+${event.requiredSkills.length - 3} more</span>` : 
                                    ''
                                }
                            </div>
                        ` : ''}
                        
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span class="font-medium">Organizer:</span> ${event.organizerName || 'Unknown'}
                            </div>
                            <div>
                                <span class="font-medium">Location:</span> ${event.location || 'Not specified'}
                            </div>
                            <div>
                                <span class="font-medium">Start:</span> ${startTime}
                            </div>
                            <div>
                                <span class="font-medium">End:</span> ${endTime}
                            </div>
                            <div>
                                <span class="font-medium">Volunteers:</span> ${volunteersText}
                            </div>
                            <div>
                                <span class="font-medium">Status:</span> ${statusBadge}
                            </div>
                        </div>
                        
                        <div class="text-xs text-gray-500">
                            Created: ${AdminUtils.formatDate(event.createdAt)}
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="adminEventsManager.viewEventDetails('${event.id}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            View Details
                        </button>
                        ${event.status === 'pending' ? `
                            <button onclick="adminEventsManager.approveEvent('${event.id}')" 
                                    class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Approve
                            </button>
                            <button onclick="adminEventsManager.rejectEvent('${event.id}')" 
                                    class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Reject
                            </button>
                        ` : ''}
                        ${event.status === 'approved' || event.status === 'active' ? `
                            <button onclick="adminEventsManager.cancelEvent('${event.id}')" 
                                    class="bg-warning hover:bg-yellow-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Cancel
                            </button>
                        ` : ''}
                        <button onclick="adminEventsManager.editEvent('${event.id}')" 
                                class="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            Edit
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async editEvent(eventId) {
        try {
            const eventDoc = await db.collection('events').doc(eventId).get();
            if (!eventDoc.exists) {
                AdminUtils.showToast('Event not found', 'error');
                return;
            }

            const eventData = eventDoc.data();
            this.populateEditForm(eventId, eventData);
            AdminUtils.openModal('editEventModal');
            
        } catch (error) {
            console.error('Error loading event for editing:', error);
            AdminUtils.showToast('Error loading event for editing', 'error');
        }
    }

    populateEditForm(eventId, eventData) {
        // Set event ID
        document.getElementById('editEventId').value = eventId;
        
        // Populate basic fields
        document.getElementById('editEventName').value = eventData.name || '';
        document.getElementById('editEventDescription').value = eventData.description || '';
        document.getElementById('editEventCategory').value = eventData.category || '';
        document.getElementById('editEventLocation').value = eventData.location || '';
        document.getElementById('editMaxVolunteers').value = eventData.maxVolunteers || 1;
        document.getElementById('editEventStatus').value = eventData.status || 'pending';
        document.getElementById('editAdminNotes').value = eventData.adminNotes || '';

        // Handle dates properly
        document.getElementById('editEventStart').value = this.formatDateForInput(eventData.startTime);
        document.getElementById('editEventEnd').value = this.formatDateForInput(eventData.endTime);

        // Populate skills
        this.editRequiredSkills = [...(eventData.requiredSkills || [])];
        this.updateEditSelectedSkillsChips();

        // Check corresponding checkboxes
        document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.checked = this.editRequiredSkills.includes(checkbox.value);
        });

        // Update modal title
        document.getElementById('editEventModalTitle').textContent = `Edit Event: ${eventData.name}`;
    }

    formatDateForInput(dateValue) {
        try {
            let date;
            if (dateValue && typeof dateValue.toDate === 'function') {
                date = dateValue.toDate();
            } else if (dateValue instanceof Date) {
                date = dateValue;
            } else if (dateValue && dateValue.seconds) {
                date = new Date(dateValue.seconds * 1000);
            } else {
                date = new Date(dateValue);
            }
            
            if (isNaN(date.getTime())) {
                console.warn('Invalid date value:', dateValue);
                return '';
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting date:', error, dateValue);
            return '';
        }
    }

    async handleEditEvent(e) {
        e.preventDefault();
        
        const eventId = document.getElementById('editEventId').value;
        const formData = new FormData(e.target);
        
        // Convert datetime-local inputs to proper Date objects
        const startTime = new Date(formData.get('editEventStart'));
        const endTime = new Date(formData.get('editEventEnd'));
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            AdminUtils.showToast('Please enter valid date and time', 'error');
            return;
        }
        
        if (startTime >= endTime) {
            AdminUtils.showToast('End time must be after start time', 'error');
            return;
        }
        
        const eventData = {
            name: formData.get('editEventName'),
            description: formData.get('editEventDescription'),
            category: formData.get('editEventCategory'),
            location: formData.get('editEventLocation'),
            maxVolunteers: parseInt(formData.get('editMaxVolunteers')),
            startTime: startTime,
            endTime: endTime,
            status: formData.get('editEventStatus'),
            requiredSkills: this.editRequiredSkills,
            adminNotes: formData.get('editAdminNotes'),
            updatedAt: new Date(),
            updatedBy: this.currentAdmin.uid
        };
        
        try {
            await db.collection('events').doc(eventId).update(eventData);
            
            // Create admin action notification
            await db.collection('adminNotifications').add({
                type: 'event_updated',
                title: 'Event Updated',
                message: `Event "${eventData.name}" has been updated by admin`,
                eventId: eventId,
                read: false,
                createdAt: new Date()
            });

            AdminUtils.showToast('Event updated successfully', 'success');
            AdminUtils.closeModal('editEventModal');
            
        } catch (error) {
            console.error('Error updating event:', error);
            AdminUtils.showToast('Error updating event', 'error');
        }
    }

    // Keep your existing methods (viewEventDetails, approveEvent, rejectEvent, cancelEvent, etc.)
    async viewEventDetails(eventId) {
        try {
            const eventDoc = await db.collection('events').doc(eventId).get();
            if (!eventDoc.exists) {
                AdminUtils.showToast('Event not found', 'error');
                return;
            }

            const eventData = eventDoc.data();
            
            // Get event participants
            const participantsSnapshot = await db.collection('eventParticipants')
                .where('eventId', '==', eventId)
                .get();
            
            const participants = [];
            participantsSnapshot.forEach(doc => {
                participants.push(doc.data());
            });

            // Get organizer details
            let organizerDetails = null;
            if (eventData.organizerId) {
                const organizerDoc = await db.collection('organizers').doc(eventData.organizerId).get();
                if (organizerDoc.exists) {
                    organizerDetails = organizerDoc.data();
                }
            }

            const modalContent = `
                <div class="space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Event Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Event Details</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Name:</span> ${eventData.name}</p>
                                    <p><span class="font-medium">Reference #:</span> ${eventData.refNumber || 'N/A'}</p>
                                    <p><span class="font-medium">Category:</span> ${eventData.category || 'Not specified'}</p>
                                    <p><span class="font-medium">Status:</span> ${AdminUtils.getStatusBadge(eventData.status || 'pending')}</p>
                                    <p><span class="font-medium">Created:</span> ${AdminUtils.formatDate(eventData.createdAt)}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Date & Time</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Start:</span> ${AdminUtils.formatDate(eventData.startTime)}</p>
                                    <p><span class="font-medium">End:</span> ${AdminUtils.formatDate(eventData.endTime)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Location & Capacity</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Location:</span> ${eventData.location || 'Not specified'}</p>
                                    <p><span class="font-medium">Volunteers:</span> ${eventData.currentVolunteers || 0}/${eventData.maxVolunteers || 0}</p>
                                </div>
                            </div>

                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Organizer Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Organization:</span> ${eventData.organizerName || 'Unknown'}</p>
                                    ${organizerDetails ? `
                                        <p><span class="font-medium">Contact:</span> ${organizerDetails.contactPerson || 'N/A'}</p>
                                        <p><span class="font-medium">Email:</span> ${organizerDetails.officialEmail || 'N/A'}</p>
                                        <p><span class="font-medium">Phone:</span> ${organizerDetails.contactNumber || 'N/A'}</p>
                                    ` : '<p class="text-gray-500">Organizer details not available</p>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Description</h4>
                        <div class="mt-2 text-sm text-gray-600">
                            <p>${eventData.description || 'No description provided.'}</p>
                        </div>
                    </div>

                    <!-- Required Skills -->
                    ${eventData.requiredSkills && eventData.requiredSkills.length > 0 ? `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Required Skills (${eventData.requiredSkills.length})</h4>
                        <div class="mt-2 flex flex-wrap gap-1">
                            ${eventData.requiredSkills.map(skill => 
                                `<span class="skill-chip">${skill}</span>`
                            ).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Admin Notes -->
                    ${eventData.adminNotes ? `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Admin Notes</h4>
                        <div class="mt-2 text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                            <p>${eventData.adminNotes}</p>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Participants -->
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Participants (${participants.length})</h4>
                        <div class="mt-2 space-y-3 text-sm">
                            ${participants.length > 0 ? `
                                ${participants.slice(0, 5).map(participant => `
                                    <div class="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                                        <p class="font-medium text-green-800">${participant.userFirstName || ''} ${participant.userLastName || ''}</p>
                                        <p class="text-green-600">Status: ${participant.status || 'unknown'}</p>
                                        <p class="text-green-600">Joined: ${AdminUtils.formatDate(participant.joinedAt)}</p>
                                    </div>
                                `).join('')}
                                ${participants.length > 5 ? 
                                    `<p class="text-sm text-gray-500 text-center mt-2">+${participants.length - 5} more participants</p>` : 
                                    ''
                                }
                            ` : `
                                <p class="text-gray-500 text-center py-4">No participants yet.</p>
                            `}
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-2 pt-4 border-t">
                        <button onclick="adminEventsManager.editEvent('${eventId}')" 
                                class="flex-1 bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Edit Event
                        </button>
                        ${eventData.status === 'pending' ? `
                            <button onclick="adminEventsManager.approveEvent('${eventId}')" 
                                    class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Approve Event
                            </button>
                            <button onclick="adminEventsManager.rejectEvent('${eventId}')" 
                                    class="flex-1 bg-danger hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Reject Event
                            </button>
                        ` : ''}
                        ${eventData.status === 'approved' || eventData.status === 'active' ? `
                            <button onclick="adminEventsManager.cancelEvent('${eventId}')" 
                                    class="flex-1 bg-warning hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Cancel Event
                            </button>
                        ` : ''}
                        ${eventData.status === 'cancelled' ? `
                            <button onclick="adminEventsManager.reactivateEvent('${eventId}')" 
                                    class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Reactivate Event
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            document.getElementById('eventModalTitle').textContent = `Event: ${eventData.name}`;
            document.getElementById('eventModalContent').innerHTML = modalContent;
            AdminUtils.openModal('eventDetailsModal');

        } catch (error) {
            console.error('Error loading event details:', error);
            AdminUtils.showToast('Error loading event details', 'error');
        }
    }

    async approveEvent(eventId) {
        AdminUtils.showConfirmation(
            'Approve Event',
            'Are you sure you want to approve this event? It will become visible to volunteers.',
            async () => {
                try {
                    await db.collection('events').doc(eventId).update({
                        status: 'approved',
                        approvedAt: new Date(),
                        approvedBy: this.currentAdmin.uid
                    });

                    // Create notification
                    await db.collection('adminNotifications').add({
                        type: 'event_approved',
                        title: 'Event Approved',
                        message: `An event has been approved by admin`,
                        read: false,
                        createdAt: new Date()
                    });

                    await this.createOrganizerNotification(
                        eventId,
                        'event_approved',
                        'Your event has been approved by the admin.'
                    );

                    AdminUtils.showToast('Event approved successfully', 'success');
                    AdminUtils.closeModal('confirmationModal');
                    
                } catch (error) {
                    console.error('Error approving event:', error);
                    AdminUtils.showToast('Error approving event', 'error');
                }
            }
        );
    }

    async rejectEvent(eventId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await db.collection('events').doc(eventId).update({
                status: 'rejected',
                rejectionReason: reason,
                rejectedAt: new Date(),
                rejectedBy: this.currentAdmin.uid
            });

            // Create notification
            await db.collection('adminNotifications').add({
                type: 'event_rejected',
                title: 'Event Rejected',
                message: `An event has been rejected by admin. Reason: ${reason}`,
                read: false,
                createdAt: new Date()
            });

            await this.createOrganizerNotification(
                eventId,
                'event_rejected',
                `Your event has been rejected. Reason: ${reason}`,
                { rejectionReason: reason }
            );

            AdminUtils.showToast('Event rejected successfully', 'success');
            
        } catch (error) {
            console.error('Error rejecting event:', error);
            AdminUtils.showToast('Error rejecting event', 'error');
        }
    }

    async cancelEvent(eventId) {
        AdminUtils.showConfirmation(
            'Cancel Event',
            'Are you sure you want to cancel this event? Participants will be notified.',
            async () => {
                // optional: ask for reason just like rejectEvent
                const reason = prompt('Please provide a reason for cancellation (optional):') || '';

                try {
                    await db.collection('events').doc(eventId).update({
                        status: 'cancelled',
                        cancelledAt: new Date(),
                        cancelledBy: this.currentAdmin.uid,
                        ...(reason ? { cancellationReason: reason } : {})
                    });

                    await db.collection('adminNotifications').add({
                        type: 'event_cancelled',
                        title: 'Event Cancelled',
                        message: reason
                            ? `An event has been cancelled by admin. Reason: ${reason}`
                            : 'An event has been cancelled by admin.',
                        read: false,
                        createdAt: new Date()
                    });

                    await this.createOrganizerNotification(
                        eventId,
                        'event_cancelled',
                        reason
                            ? 'Your event has been cancelled by the admin. Reason: ' + reason
                            : 'Your event has been cancelled by the admin.',
                        reason ? { cancellationReason: reason } : {}
                    );

                    AdminUtils.showToast('Event cancelled successfully', 'success');
                    AdminUtils.closeModal('confirmationModal');
                } catch (error) {
                    console.error('Error cancelling event:', error);
                    AdminUtils.showToast('Error cancelling event', 'error');
                }
            }
        );
    }

    async reactivateEvent(eventId) {
        try {
            await db.collection('events').doc(eventId).update({
                status: 'approved',
                reactivatedAt: new Date(),
                reactivatedBy: this.currentAdmin.uid
            });

            await db.collection('adminNotifications').add({
                type: 'event_approved',
                title: 'Event Reactivated',
                message: `An event has been reactivated by admin.`,
                read: false,
                createdAt: new Date()
            });

            await this.createOrganizerNotification(
                eventId,
                'event_approved', // or 'event_reactivated' if you add that type on organizer side
                'Your event has been reactivated by the admin.'
            );

            AdminUtils.showToast('Event reactivated successfully', 'success');
            
        } catch (error) {
            console.error('Error reactivating event:', error);
            AdminUtils.showToast('Error reactivating event', 'error');
        }
    }

    getEmptyStateHTML(icon, message) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i data-feather="${icon}" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
                <p>${message}</p>
            </div>
        `;
    }

    async createOrganizerNotification(eventId, type, message, extraData = {}) {
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) return;

        const event = eventDoc.data();

        await db.collection('organizerNotifications').add({
            organizerId: event.organizerId,
            eventId: eventId,
            type,                      // 'event_approved' | 'event_rejected' | 'event_cancelled' | 'event_updated' | 'event_reactivated'
            title: event.name || 'Event Update',
            message,
            read: false,
            createdAt: new Date(),
            ...extraData              // e.g. { rejectionReason: reason }
        });
    }

}

// Make globally accessible
window.adminEventsManager = new AdminEventsManager();