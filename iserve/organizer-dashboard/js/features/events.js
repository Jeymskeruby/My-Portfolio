// Events management feature module
class EventsManager {
    constructor() {
        this.events = [];
        this.currentOrganizer = null;
        this.requiredSkills = []; // For create modal
        this.editRequiredSkills = []; // For edit modal
        this.interestsData = this.getInterestsData();
        this.editingEventId = null;
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

    generateReferenceNumber() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    async init(currentOrganizer) {
        this.currentOrganizer = currentOrganizer;
        this.setupEventListeners();
        this.setupRealTimeListeners();
        this.setupSkillsManagement();
        this.setupEditSkillsManagement(); // Add this line
    }

    setupSkillsManagement() {
        const skillsDropdown = document.getElementById('eventSkillsDropdown');
        const skillsDropdownContent = document.getElementById('eventSkillsDropdownContent');
        
        // Toggle dropdown
        skillsDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !skillsDropdownContent.classList.contains('hidden');
            
            if (!isOpen) {
                skillsDropdownContent.classList.remove('hidden');
                skillsDropdown.classList.add('dropdown-open');
            } else {
                skillsDropdownContent.classList.add('hidden');
                skillsDropdown.classList.remove('dropdown-open');
            }
        });
        
        // Prevent dropdown from closing when clicking inside
        skillsDropdownContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!skillsDropdown.contains(e.target) && !skillsDropdownContent.contains(e.target)) {
                skillsDropdownContent.classList.add('hidden');
                skillsDropdown.classList.remove('dropdown-open');
            }
        });
        
        // Handle skill checkbox changes for CREATE modal
        document.querySelectorAll('#eventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.addSkillChip(e.target.value);
                } else {
                    this.removeSkillChip(e.target.value);
                }
            });
        });
        
        // Select All / Deselect All functionality for CREATE modal
        document.getElementById('selectAllSkills').addEventListener('click', () => {
            document.querySelectorAll('#eventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    this.addSkillChip(checkbox.value);
                }
            });
        });
        
        document.getElementById('deselectAllSkills').addEventListener('click', () => {
            document.querySelectorAll('#eventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    this.removeSkillChip(checkbox.value);
                }
            });
        });
    }

    setupEditSkillsManagement() {
        const editSkillsDropdown = document.getElementById('editEventSkillsDropdown');
        const editSkillsDropdownContent = document.getElementById('editEventSkillsDropdownContent');
        
        // Toggle dropdown for EDIT modal
        editSkillsDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !editSkillsDropdownContent.classList.contains('hidden');
            
            if (!isOpen) {
                editSkillsDropdownContent.classList.remove('hidden');
                editSkillsDropdown.classList.add('dropdown-open');
            } else {
                editSkillsDropdownContent.classList.add('hidden');
                editSkillsDropdown.classList.remove('dropdown-open');
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
                editSkillsDropdown.classList.remove('dropdown-open');
            }
        });
        
        // Handle skill checkbox changes for EDIT modal
        document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.addEditSkillChip(e.target.value);
                } else {
                    this.removeEditSkillChip(e.target.value);
                }
            });
        });
        
        // Select All / Deselect All functionality for EDIT modal
        document.getElementById('editSelectAllSkills').addEventListener('click', () => {
            document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    this.addEditSkillChip(checkbox.value);
                }
            });
        });
        
        document.getElementById('editDeselectAllSkills').addEventListener('click', () => {
            document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    this.removeEditSkillChip(checkbox.value);
                }
            });
        });
    }

    addSkillChip(skill) {
        if (!this.requiredSkills.includes(skill)) {
            this.requiredSkills.push(skill);
            this.updateSelectedSkillsChips();
        }
    }

    removeSkillChip(skill) {
        this.requiredSkills = this.requiredSkills.filter(s => s !== skill);
        this.updateSelectedSkillsChips();
        
        // Uncheck the corresponding checkbox
        const checkbox = document.querySelector(`#eventSkillsDropdownContent .skill-checkbox[value="${skill}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    updateSelectedSkillsChips() {
        const container = document.getElementById('selectedEventSkills');
        const placeholder = document.getElementById('eventSkillsPlaceholder');
        container.innerHTML = '';
        
        if (this.requiredSkills.length > 0) {
            placeholder.classList.add('hidden');
        } else {
            placeholder.classList.remove('hidden');
        }
        
        this.requiredSkills.forEach(skill => {
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
                this.removeSkillChip(skill);
                container.removeChild(chip);
            });
        });
        
        feather.replace();
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

   clearSkills() {
        this.requiredSkills = [];
        this.updateSelectedSkillsChips();
        
        // Uncheck all checkboxes in CREATE modal
        document.querySelectorAll('#eventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    clearEditSkills() {
        this.editRequiredSkills = [];
        this.updateEditSelectedSkillsChips();
        
        // Uncheck all checkboxes in EDIT modal
        document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    setupEventListeners() {
        // Create event button
        document.getElementById('createEventBtn').addEventListener('click', () => {
            this.openCreateEventModal();
        });

        document.getElementById('createFirstEventBtn').addEventListener('click', () => {
            this.openCreateEventModal();
        });

        // Event form submission
        document.getElementById('createEventForm').addEventListener('submit', (e) => this.handleCreateEvent(e));
        
        // Edit event form submission
        document.getElementById('editEventForm').addEventListener('submit', (e) => this.handleEditEvent(e));

        // Event filter and search
        document.getElementById('eventFilter').addEventListener('change', () => this.filterEvents());
        document.getElementById('eventSearch').addEventListener('input', () => this.filterEvents());
    }

    openCreateEventModal() {
        this.editingEventId = null;
        document.getElementById('createEventModalTitle').textContent = 'Create New Event';
        document.getElementById('createEventForm').reset();
        this.clearSkills();
        DashboardUtils.openModal('createEventModal');
    }

    async checkAndUpdateEventStatuses() {
        const now = new Date();
        
        try {
            const eventsSnapshot = await db.collection('events')
                .where('organizerId', '==', this.currentOrganizer.uid)
                .where('isDeleted', '==', false)
                .where('status', 'in', ['approved', 'active'])
                .get();

            const batch = db.batch();
            let updatedCount = 0;

            eventsSnapshot.forEach(doc => {
                const event = doc.data();
                const endTime = event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime);
                
                // Mark as completed if end time has passed
                if (endTime < now && event.status !== 'completed') {
                    batch.update(doc.ref, {
                        status: 'completed',
                        updatedAt: new Date()
                    });
                    updatedCount++;
                }
                // Optional: Mark as active if start time has passed but end time hasn't
                else if (event.status === 'approved') {
                    const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
                    if (startTime <= now && endTime >= now) {
                        batch.update(doc.ref, {
                            status: 'active',
                            updatedAt: new Date()
                        });
                        updatedCount++;
                    }
                }
            });

            if (updatedCount > 0) {
                await batch.commit();
                console.log(`Updated ${updatedCount} event statuses`);
            }
        } catch (error) {
            console.error('Error updating event statuses:', error);
        }
    }

    setupRealTimeListeners() {
        const organizerId = this.currentOrganizer.uid;
        
        // Check statuses every 5 minutes instead of every minute for better performance
        this.statusCheckInterval = setInterval(() => {
            this.checkAndUpdateEventStatuses();
        }, 300000); // Check every 5 minutes
        
        // Initial status check
        this.checkAndUpdateEventStatuses();
        
        db.collection('events')
            .where('organizerId', '==', organizerId)
            .where('isDeleted', '==', false)
            .onSnapshot((snapshot) => {
                this.events = [];
                snapshot.forEach(doc => {
                    this.events.push({ id: doc.id, ...doc.data() });
                });
                this.loadEvents();
            });
    }

    loadEvents() {
        const eventsList = document.getElementById('eventsList');
        
        if (this.events.length === 0) {
            eventsList.innerHTML = this.getEmptyEventsState();
        } else {
            eventsList.innerHTML = this.events.map(event => this.createEventCard(event)).join('');
        }
        feather.replace();
    }

    filterEvents() {
        const filterValue = document.getElementById('eventFilter').value;
        const searchTerm = document.getElementById('eventSearch').value.toLowerCase();
        
        let filteredEvents = this.events;
        
        if (filterValue !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.status === filterValue);
        }
        
        if (searchTerm) {
            filteredEvents = filteredEvents.filter(event => 
                event.name.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm) ||
                event.location.toLowerCase().includes(searchTerm) ||
                (event.refNumber && event.refNumber.toString().includes(searchTerm))
            );
        }
        
        const eventsList = document.getElementById('eventsList');
        if (filteredEvents.length === 0) {
            eventsList.innerHTML = '<div class="text-center py-8 text-gray-500">No events match your criteria</div>';
        } else {
            eventsList.innerHTML = filteredEvents.map(event => this.createEventCard(event)).join('');
        }
        feather.replace();
    }

    createEventCard(event) {
        const canEditDelete = event.status === 'pending';
        const canCancel = event.status === 'approved' || event.status === 'active';
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="text-lg font-semibold text-gray-800">${event.name}</h3>
                            <span class="text-sm text-gray-500">#${event.refNumber || 'N/A'}</span>
                        </div>
                        <p class="text-gray-600 text-sm mb-2">${event.description}</p>
                        
                        ${event.requiredSkills && event.requiredSkills.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mb-2">
                                ${event.requiredSkills.map(skill => 
                                    `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">${skill}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="flex flex-wrap gap-4 mt-3 text-sm">
                            <div class="flex items-center gap-1">
                                <i data-feather="calendar" class="w-4 h-4 text-gray-500"></i>
                                <span>${DashboardUtils.formatDate(event.startTime)}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <i data-feather="map-pin" class="w-4 h-4 text-gray-500"></i>
                                <span>${event.location}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <i data-feather="users" class="w-4 h-4 text-gray-500"></i>
                                <span>${event.currentVolunteers || 0}/${event.maxVolunteers} volunteers</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <span class="inline-block px-3 py-1 text-xs rounded-full ${DashboardUtils.getStatusBadgeClass(event.status)}">
                            ${event.status}
                        </span>
                        <div class="flex gap-2">
                            <button onclick="eventsManager.viewEventDetails('${event.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
                                <i data-feather="eye" class="w-4 h-4"></i>
                            </button>
                            ${canEditDelete ? `
                                <button onclick="eventsManager.editEvent('${event.id}')" class="text-green-600 hover:text-green-800 text-sm">
                                    <i data-feather="edit" class="w-4 h-4"></i>
                                </button>
                                <button onclick="eventsManager.withdrawEvent('${event.id}')" class="text-red-600 hover:text-red-800 text-sm">
                                    <i data-feather="trash-2" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                            ${canCancel ? `
                                <button onclick="eventsManager.cancelEvent('${event.id}')" class="text-orange-600 hover:text-orange-800 text-sm">
                                    <i data-feather="x" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    viewEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            const modalContent = `
                <h3 class="text-lg font-semibold mb-4">${event.name}</h3>
                <div class="space-y-3">
                    <p><strong>Reference #:</strong> ${event.refNumber || 'N/A'}</p>
                    <p><strong>Description:</strong> ${event.description}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p><strong>Start:</strong> ${DashboardUtils.formatDate(event.startTime)}</p>
                    <p><strong>End:</strong> ${DashboardUtils.formatDate(event.endTime)}</p>
                    <p><strong>Volunteers:</strong> ${event.currentVolunteers || 0}/${event.maxVolunteers}</p>
                    <p><strong>Status:</strong> <span class="inline-block px-2 py-1 text-xs rounded-full ${DashboardUtils.getStatusBadgeClass(event.status)}">${event.status}</span></p>
                    ${event.requiredSkills && event.requiredSkills.length > 0 ? `
                        <div>
                            <strong>Required Skills:</strong>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${event.requiredSkills.map(skill => 
                                    `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">${skill}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            DashboardUtils.showCustomModal('Event Details', modalContent);
        }
    }

    getEmptyEventsState() {
        return `
            <div class="text-center py-12 text-gray-500">
                <i data-feather="calendar" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                <p class="text-lg mb-4">No events found</p>
                <button onclick="DashboardUtils.openModal('createEventModal')" class="bg-primary hover:bg-secondary text-white font-semibold py-2 px-6 rounded-lg transition duration-300">
                    Create Your First Event
                </button>
            </div>
        `;
    }

    async handleCreateEvent(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Convert datetime-local inputs to proper Date objects
        const startTime = new Date(formData.get('eventStart'));
        const endTime = new Date(formData.get('eventEnd'));
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            DashboardUtils.showToast('Please enter valid date and time', 'error');
            return;
        }
        
        if (startTime >= endTime) {
            DashboardUtils.showToast('End time must be after start time', 'error');
            return;
        }

        // Lock the submit button so a double-click can't create two events.
        const submitBtn = e.target.querySelector('[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
        }

        const eventData = {
            name: formData.get('eventName'),
            description: formData.get('eventDescription'),
            category: formData.get('eventCategory'),
            startTime: startTime,
            endTime: endTime,
            location: formData.get('eventLocation'),
            maxVolunteers: parseInt(formData.get('maxVolunteers')),
            organizerId: this.currentOrganizer.uid,
            organizerName: this.currentOrganizer.organizationName,
            requiredSkills: this.requiredSkills,
            refNumber: this.generateReferenceNumber(),
            status: 'pending',
            isDeleted: false,
            createdAt: new Date(),
            currentVolunteers: 0,
            updatedAt: new Date()
        };
        
        try {
            const eventRef = await db.collection('events').add(eventData);

            // Notify admins about new event registration request
            await db.collection('adminNotifications').add({
                type: 'new_event_request',          // define this type in your admin dashboard if you show it
                title: 'New Event Registration Request',
                message: `New event "${eventData.name}" submitted by ${this.currentOrganizer.organizationName} for approval.`,
                eventId: eventRef.id,
                organizerId: this.currentOrganizer.uid,
                read: false,
                createdAt: new Date()
            });

            DashboardUtils.showToast('Event submitted for admin approval', 'success');
            DashboardUtils.closeModal('createEventModal');
            e.target.reset();
            this.clearSkills();
        } catch (error) {
            console.error('Error creating event:', error);
            DashboardUtils.showToast('Error creating event', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            this.editingEventId = eventId;
            this.populateEditForm(event);
            DashboardUtils.openModal('editEventModal');
        }
    }

    populateEditForm(event) {
        // Populate form fields
        document.getElementById('editEventName').value = event.name;
        document.getElementById('editEventDescription').value = event.description;
        document.getElementById('editEventCategory').value = event.category;
        
        // Handle Firestore timestamps properly
        document.getElementById('editEventStart').value = this.formatDateForInput(event.startTime);
        document.getElementById('editEventEnd').value = this.formatDateForInput(event.endTime);
        
        document.getElementById('editEventLocation').value = event.location;
        document.getElementById('editMaxVolunteers').value = event.maxVolunteers;
        
        // Populate skills for EDIT modal (guard: an event may have no skills)
        this.editRequiredSkills = [...(event.requiredSkills || [])];
        this.updateEditSelectedSkillsChips();
        
        // Check corresponding checkboxes in EDIT modal
        document.querySelectorAll('#editEventSkillsDropdownContent .skill-checkbox').forEach(checkbox => {
            checkbox.checked = this.editRequiredSkills.includes(checkbox.value);
        });
        
        // Update modal title
        document.getElementById('editEventModalTitle').textContent = `Edit Event: ${event.name}`;
    }

    formatDateForInput(dateValue) {
        try {
            // Handle Firestore timestamp objects
            let date;
            if (dateValue && typeof dateValue.toDate === 'function') {
                // This is a Firestore Timestamp object
                date = dateValue.toDate();
            } else if (dateValue instanceof Date) {
                // This is already a Date object
                date = dateValue;
            } else if (dateValue && dateValue.seconds) {
                // This is a Firestore timestamp with seconds property
                date = new Date(dateValue.seconds * 1000);
            } else {
                // Try to parse as a string or timestamp
                date = new Date(dateValue);
            }
            
            // Check if the date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date value:', dateValue);
                return '';
            }
            
            // Format for datetime-local input (YYYY-MM-DDTHH:MM)
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
        const formData = new FormData(e.target);
        
        // Convert datetime-local inputs to proper Date objects
        const startTime = new Date(formData.get('editEventStart'));
        const endTime = new Date(formData.get('editEventEnd'));
        
        const eventData = {
            name: formData.get('editEventName'),
            description: formData.get('editEventDescription'),
            category: formData.get('editEventCategory'),
            startTime: startTime,
            endTime: endTime,
            location: formData.get('editEventLocation'),
            maxVolunteers: parseInt(formData.get('editMaxVolunteers')),
            requiredSkills: this.editRequiredSkills, // Use editRequiredSkills
            updatedAt: new Date()
        };
        
        // Validate dates
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            DashboardUtils.showToast('Please enter valid date and time', 'error');
            return;
        }
        
        if (startTime >= endTime) {
            DashboardUtils.showToast('End time must be after start time', 'error');
            return;
        }
        
        try {
            await db.collection('events').doc(this.editingEventId).update(eventData);
            DashboardUtils.showToast('Event updated successfully', 'success');
            DashboardUtils.closeModal('editEventModal');
            this.editingEventId = null;
            this.clearEditSkills(); // Clear edit skills after successful update
        } catch (error) {
            console.error('Error updating event:', error);
            DashboardUtils.showToast('Error updating event', 'error');
        }
    }

    async cancelEvent(eventId) {
        if (confirm('Are you sure you want to cancel this event? Participants will be notified.')) {
            try {
                await db.collection('events').doc(eventId).update({
                    status: 'cancelled',
                    cancelledAt: new Date()
                });
                DashboardUtils.showToast('Event cancelled successfully', 'success');
            } catch (error) {
                console.error('Error cancelling event:', error);
                DashboardUtils.showToast('Error cancelling event', 'error');
            }
        }
    }

    async withdrawEvent(eventId) {
        if (confirm('Are you sure you want to withdraw this event request?')) {
            try {
                await db.collection('events').doc(eventId).update({
                    isDeleted: true,
                    status: 'withdrawn',
                    updatedAt: new Date()
                });
                DashboardUtils.showToast('Event request withdrawn', 'success');
            } catch (error) {
                console.error('Error withdrawing event:', error);
                DashboardUtils.showToast('Error withdrawing event', 'error');
            }
        }
    }

    // Add this method to your class
    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
    }
}