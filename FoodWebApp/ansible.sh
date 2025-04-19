# ssh in instance
#!/bin/bash
useradd -u 1002 -m -s /bin/bash ansible
echo "ansible:ansible" | chpasswd
echo "ansible ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/ansible
chmod 0440 /etc/sudoers.d/ansible
echo "ansible ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
chmod 0440 /etc/sudoers

hostnamectl set-hostname controller
echo "ansible" > /etc/hostname


ssh-keygen -t rsa -b 4096 -f /home/ansible/.ssh/id_rsa -N "" -C "ansible@controller"

#what is the difference between sudoers and sudoers.d and visudo?
# sudoers is the main file that defines the sudo privileges for users and groups. It is located at /etc/sudoers.
# The sudoers.d directory is a place to store additional configuration files that can be included in the main sudoers file. This allows for better organization and management of sudo privileges, especially in larger environments.
# Each file in the sudoers.d directory should have a .conf extension and can contain the same syntax as the main sudoers file.
# The visudo command is a special command used to edit the sudoers file safely. It checks for syntax errors before saving the changes, preventing potential issues that could arise from incorrect configurations. When using visudo, it is recommended to edit the main sudoers file directly rather than creating new files in the sudoers.d directory.
# This is because visudo locks the sudoers file to prevent concurrent edits, ensuring that only one user can modify it at a time.


 ssh-copy-id 13.235.45.237
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/ansible/.ssh/id_rsa.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
ansible@13.235.45.237: Permission denied (publickey).

